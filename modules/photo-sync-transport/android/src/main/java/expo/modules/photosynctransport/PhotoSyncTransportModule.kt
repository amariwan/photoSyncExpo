package expo.modules.photosynctransport

import android.net.Uri
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import jcifs.CIFSContext
import jcifs.config.PropertyConfiguration
import jcifs.context.BaseContext
import jcifs.smb.NtlmPasswordAuthenticator
import jcifs.smb.SmbFile
import jcifs.smb.SmbFileOutputStream
import net.schmizz.sshj.SSHClient
import net.schmizz.sshj.sftp.FileMode
import net.schmizz.sshj.transport.verification.PromiscuousVerifier
import java.io.File
import java.io.FileInputStream
import java.io.InputStream
import java.util.Properties

class PhotoSyncTransportModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PhotoSyncTransport")

    AsyncFunction("testSmbConnection") { config: Map<String, Any?> ->
      val startedAt = System.currentTimeMillis()
      val smbConfig = parseSmbConfig(config)

      try {
        val targetPath = smbConfig.remotePath.ifBlank { "/" }
        withSmbFile(smbConfig, targetPath) { file ->
          file.exists()
        }

        mapOf(
          "ok" to true,
          "message" to "Connected to ${smbConfig.host}:${smbConfig.port}/${smbConfig.share}.",
          "latencyMs" to (System.currentTimeMillis() - startedAt)
        )
      } catch (error: Exception) {
        mapOf(
          "ok" to false,
          "message" to sanitizeError(error),
          "latencyMs" to (System.currentTimeMillis() - startedAt)
        )
      }
    }

    AsyncFunction("listSmbDirectory") { config: Map<String, Any?>, path: String ->
      val smbConfig = parseSmbConfig(config)
      val requestedPath = normalizePosixPath(path)

      withSmbFile(smbConfig, requestedPath) { directory ->
        if (!directory.exists()) {
          throw IllegalStateException("SMB path does not exist: $requestedPath")
        }
        if (!directory.isDirectory) {
          throw IllegalStateException("SMB path is not a directory: $requestedPath")
        }

        val children = directory.listFiles() ?: emptyArray()
        children.mapNotNull { child ->
          try {
            val rawName = child.name.trimEnd('/')
            if (rawName.isBlank()) {
              return@mapNotNull null
            }

            val publicPath = joinPosixPath(requestedPath, rawName)
            mutableMapOf<String, Any?>(
              "name" to rawName,
              "type" to if (child.isDirectory) "directory" else "file",
              "path" to publicPath,
              "modifiedTime" to child.lastModified()
            ).apply {
              if (!child.isDirectory) {
                this["size"] = child.length()
              }
            }
          } finally {
            child.closeQuietly()
          }
        }
      }
    }

    AsyncFunction("uploadSmbFile") { config: Map<String, Any?>, request: Map<String, Any?> ->
      val smbConfig = parseSmbConfig(config)
      val uploadRequest = parseUploadRequest(request)
      val remotePath = normalizePosixPath(uploadRequest.remotePath)
      val parentPath = parentDirectory(remotePath)

      if (parentPath.isNotBlank() && parentPath != "/") {
        withSmbFile(smbConfig, parentPath) { parent ->
          if (!parent.exists()) {
            parent.mkdirs()
          }
        }
      }

      val targetFile = buildSmbFile(smbConfig, remotePath)
      try {
        openLocalInputStream(uploadRequest.localUri).use { input ->
          SmbFileOutputStream(targetFile).use { output ->
            input.copyTo(output)
          }
        }
      } finally {
        targetFile.closeQuietly()
      }
    }

    AsyncFunction("testSshConnection") { config: Map<String, Any?> ->
      val startedAt = System.currentTimeMillis()
      val sftpConfig = parseSftpConfig(config)

      try {
        withConnectedSsh(sftpConfig) {
          // Connection/auth completed.
        }

        mapOf(
          "ok" to true,
          "message" to "SSH connection established to ${sftpConfig.host}:${sftpConfig.port}.",
          "latencyMs" to (System.currentTimeMillis() - startedAt)
        )
      } catch (error: Exception) {
        mapOf(
          "ok" to false,
          "message" to sanitizeError(error),
          "latencyMs" to (System.currentTimeMillis() - startedAt)
        )
      }
    }

    AsyncFunction("testSftpConnection") { config: Map<String, Any?> ->
      val startedAt = System.currentTimeMillis()
      val sftpConfig = parseSftpConfig(config)

      try {
        withConnectedSsh(sftpConfig) { ssh ->
          ssh.newSFTPClient().use { sftp ->
            sftp.ls(normalizePosixPath(sftpConfig.remotePath))
          }
        }

        mapOf(
          "ok" to true,
          "message" to "Connected to ${sftpConfig.host}:${sftpConfig.port} via SFTP.",
          "latencyMs" to (System.currentTimeMillis() - startedAt)
        )
      } catch (error: Exception) {
        mapOf(
          "ok" to false,
          "message" to sanitizeError(error),
          "latencyMs" to (System.currentTimeMillis() - startedAt)
        )
      }
    }

    AsyncFunction("listSftpDirectory") { config: Map<String, Any?>, path: String ->
      val sftpConfig = parseSftpConfig(config)
      val requestedPath = normalizePosixPath(path)

      withConnectedSsh(sftpConfig) { ssh ->
        ssh.newSFTPClient().use { sftp ->
          sftp.ls(requestedPath)
            .filter { it.name != "." && it.name != ".." }
            .map { entry ->
              val isDirectory = entry.attributes.type == FileMode.Type.DIRECTORY
              val modifiedTimeSeconds = entry.attributes.mtime.toLong()
              mutableMapOf<String, Any?>(
                "name" to entry.name,
                "type" to if (isDirectory) "directory" else "file",
                "path" to joinPosixPath(requestedPath, entry.name),
                "modifiedTime" to (modifiedTimeSeconds * 1000L)
              ).apply {
                if (!isDirectory) {
                  this["size"] = entry.attributes.size
                }
              }
            }
        }
      }
    }

    AsyncFunction("uploadSftpFile") { config: Map<String, Any?>, request: Map<String, Any?> ->
      val sftpConfig = parseSftpConfig(config)
      val uploadRequest = parseUploadRequest(request)
      val remotePath = normalizePosixPath(uploadRequest.remotePath)
      val parentPath = parentDirectory(remotePath)

      withConnectedSsh(sftpConfig) { ssh ->
        ssh.newSFTPClient().use { sftp ->
          if (parentPath.isNotBlank() && parentPath != "/") {
            sftp.mkdirs(parentPath)
          }

          val localFilePath = prepareLocalFilePath(uploadRequest.localUri)
          try {
            sftp.put(localFilePath, remotePath)
          } finally {
            val cachePath = appContext.reactContext?.cacheDir?.absolutePath ?: ""
            if (cachePath.isNotBlank() && localFilePath.startsWith(cachePath)) {
              File(localFilePath).delete()
            }
          }
        }
      }
    }
  }

  private data class SmbConnectionData(
    val host: String,
    val port: Int,
    val share: String,
    val remotePath: String,
    val username: String,
    val password: String,
  )

  private data class SftpConnectionData(
    val host: String,
    val port: Int,
    val remotePath: String,
    val username: String,
    val authType: String,
    val password: String,
    val privateKey: String,
  )

  private data class UploadRequestData(
    val localUri: String,
    val remotePath: String,
  )

  private fun parseSmbConfig(config: Map<String, Any?>): SmbConnectionData {
    val host = stringValue(config, "host")
    val share = stringValue(config, "share")
    val username = stringValue(config, "username")
    val password = stringValue(config, "password")
    val port = intValue(config, "port", 445)
    val remotePath = stringValue(config, "remotePath").ifBlank { "/" }

    if (host.isBlank()) {
      throw IllegalArgumentException("SMB host is required.")
    }
    if (share.isBlank()) {
      throw IllegalArgumentException("SMB share is required.")
    }
    if (username.isBlank()) {
      throw IllegalArgumentException("SMB username is required.")
    }
    if (password.isBlank()) {
      throw IllegalArgumentException("SMB password is required.")
    }

    return SmbConnectionData(
      host = host,
      port = port,
      share = share,
      remotePath = remotePath,
      username = username,
      password = password,
    )
  }

  private fun parseSftpConfig(config: Map<String, Any?>): SftpConnectionData {
    val host = stringValue(config, "host")
    val username = stringValue(config, "username")
    val authType = stringValue(config, "authType").ifBlank { "password" }
    val password = stringValue(config, "password")
    val privateKey = stringValue(config, "privateKey")
    val port = intValue(config, "port", 22)
    val remotePath = stringValue(config, "remotePath").ifBlank { "/" }

    if (host.isBlank()) {
      throw IllegalArgumentException("SFTP host is required.")
    }
    if (username.isBlank()) {
      throw IllegalArgumentException("SFTP username is required.")
    }
    if (authType == "password" && password.isBlank()) {
      throw IllegalArgumentException("SFTP password is required.")
    }
    if (authType == "key" && privateKey.isBlank()) {
      throw IllegalArgumentException("SFTP private key is required.")
    }

    return SftpConnectionData(
      host = host,
      port = port,
      remotePath = remotePath,
      username = username,
      authType = authType,
      password = password,
      privateKey = privateKey,
    )
  }

  private fun parseUploadRequest(request: Map<String, Any?>): UploadRequestData {
    val localUri = stringValue(request, "localUri")
    val remotePath = stringValue(request, "remotePath")

    if (localUri.isBlank()) {
      throw IllegalArgumentException("Upload localUri is required.")
    }
    if (remotePath.isBlank()) {
      throw IllegalArgumentException("Upload remotePath is required.")
    }

    return UploadRequestData(localUri = localUri, remotePath = remotePath)
  }

  private fun withConnectedSsh(config: SftpConnectionData, block: (SSHClient) -> Unit) {
    val ssh = SSHClient()
    ssh.addHostKeyVerifier(PromiscuousVerifier())

    try {
      ssh.connect(config.host, config.port)
      if (config.authType == "key") {
        val keyFile = writeTempPrivateKey(config.privateKey)
        try {
          val keyProvider = ssh.loadKeys(keyFile.absolutePath)
          ssh.authPublickey(config.username, keyProvider)
        } finally {
          keyFile.delete()
        }
      } else {
        ssh.authPassword(config.username, config.password)
      }

      block(ssh)
    } finally {
      if (ssh.isConnected) {
        try {
          ssh.disconnect()
        } catch (_: Exception) {
          // No-op
        }
      }
      ssh.close()
    }
  }

  private fun writeTempPrivateKey(privateKey: String): File {
    val cacheDir = appContext.reactContext?.cacheDir
      ?: throw IllegalStateException("No cache directory available for key authentication.")
    val keyFile = File.createTempFile("photosync_key_", ".pem", cacheDir)
    keyFile.writeText(privateKey)
    return keyFile
  }

  private fun <T> withSmbFile(config: SmbConnectionData, path: String, block: (SmbFile) -> T): T {
    val smbFile = buildSmbFile(config, path)
    return try {
      block(smbFile)
    } finally {
      smbFile.closeQuietly()
    }
  }

  private fun buildSmbFile(config: SmbConnectionData, path: String): SmbFile {
    val context = createSmbContext(config)
    val relativePath = normalizeShareRelativePath(path)
    val encodedPath = relativePath
      .split('/')
      .filter { it.isNotBlank() }
      .joinToString("/") { Uri.encode(it) }

    val shareName = config.share.trim().trim('/').ifBlank {
      throw IllegalArgumentException("SMB share is required.")
    }

    val baseUrl = "smb://${config.host}:${config.port}/$shareName/"
    val fullUrl = if (encodedPath.isBlank()) baseUrl else "$baseUrl$encodedPath"
    return SmbFile(fullUrl, context)
  }

  private fun createSmbContext(config: SmbConnectionData): CIFSContext {
    val properties = Properties().apply {
      setProperty("jcifs.smb.client.responseTimeout", "15000")
      setProperty("jcifs.smb.client.connTimeout", "15000")
      setProperty("jcifs.smb.client.soTimeout", "15000")
      setProperty("jcifs.smb.client.minVersion", "SMB202")
      setProperty("jcifs.smb.client.maxVersion", "SMB311")
      setProperty("jcifs.smb.client.enableSMB2", "true")
      setProperty("jcifs.smb.client.disableSMB1", "true")
    }

    val base = BaseContext(PropertyConfiguration(properties))
    val auth = NtlmPasswordAuthenticator("", config.username, config.password)
    return base.withCredentials(auth)
  }

  private fun prepareLocalFilePath(localUri: String): String {
    val uri = Uri.parse(localUri)
    if (uri.scheme == "file") {
      return uri.path ?: throw IllegalArgumentException("Invalid file URI: $localUri")
    }
    if (uri.scheme == null || uri.scheme.isBlank()) {
      return localUri
    }

    val cacheDir = appContext.reactContext?.cacheDir
      ?: throw IllegalStateException("No cache directory available for content URI upload.")
    val tempFile = File.createTempFile("photosync_upload_", ".tmp", cacheDir)

    openLocalInputStream(localUri).use { input ->
      tempFile.outputStream().use { output ->
        input.copyTo(output)
      }
    }

    return tempFile.absolutePath
  }

  private fun openLocalInputStream(localUri: String): InputStream {
    val uri = Uri.parse(localUri)
    if (uri.scheme == "content") {
      val reactContext = appContext.reactContext
        ?: throw IllegalStateException("React context unavailable for content URI upload.")
      return reactContext.contentResolver.openInputStream(uri)
        ?: throw IllegalArgumentException("Unable to open local URI: $localUri")
    }

    if (uri.scheme == "file") {
      return FileInputStream(uri.path ?: throw IllegalArgumentException("Invalid file URI: $localUri"))
    }

    return FileInputStream(localUri)
  }

  private fun normalizePosixPath(path: String): String {
    val normalized = path.trim().replace('\\', '/').replace(Regex("/+"), "/")
    if (normalized.isBlank()) {
      return "/"
    }
    return if (normalized.startsWith('/')) normalized else "/$normalized"
  }

  private fun normalizeShareRelativePath(path: String): String {
    return normalizePosixPath(path)
      .trimStart('/')
      .trimEnd('/')
  }

  private fun joinPosixPath(base: String, child: String): String {
    val normalizedBase = normalizePosixPath(base)
    return if (normalizedBase == "/") {
      "/${child.trim('/')}"
    } else {
      "${normalizedBase.trimEnd('/')}/${child.trim('/')}"
    }
  }

  private fun parentDirectory(path: String): String {
    val normalized = normalizePosixPath(path)
    val lastSlash = normalized.lastIndexOf('/')
    if (lastSlash <= 0) {
      return "/"
    }
    return normalized.substring(0, lastSlash)
  }

  private fun stringValue(map: Map<String, Any?>, key: String): String {
    return map[key]?.toString()?.trim() ?: ""
  }

  private fun intValue(map: Map<String, Any?>, key: String, fallback: Int): Int {
    val value = map[key]
    return when (value) {
      is Number -> value.toInt()
      is String -> value.toIntOrNull() ?: fallback
      else -> fallback
    }
  }

  private fun sanitizeError(error: Throwable): String {
    val message = error.message?.trim().orEmpty()
    if (message.isNotEmpty()) {
      return message
    }
    return error::class.java.simpleName
  }

  private fun SmbFile.closeQuietly() {
    try {
      close()
    } catch (_: Exception) {
      // No-op.
    }
  }
}
