import ExpoModulesCore

public class PhotoSyncTransportModule: Module {
  public func definition() -> ModuleDefinition {
    Name("PhotoSyncTransport")

    AsyncFunction("testSmbConnection") { (_: [String: Any]) -> [String: Any] in
      self.unsupportedResult(feature: "SMB")
    }

    AsyncFunction("listSmbDirectory") { (_: [String: Any], _: String) throws -> [[String: Any]] in
      throw self.unsupportedError(feature: "SMB directory listing")
    }

    AsyncFunction("uploadSmbFile") { (_: [String: Any], _: [String: Any]) throws in
      throw self.unsupportedError(feature: "SMB upload")
    }

    AsyncFunction("testSshConnection") { (_: [String: Any]) -> [String: Any] in
      self.unsupportedResult(feature: "SSH")
    }

    AsyncFunction("testSftpConnection") { (_: [String: Any]) -> [String: Any] in
      self.unsupportedResult(feature: "SFTP")
    }

    AsyncFunction("listSftpDirectory") { (_: [String: Any], _: String) throws -> [[String: Any]] in
      throw self.unsupportedError(feature: "SFTP directory listing")
    }

    AsyncFunction("uploadSftpFile") { (_: [String: Any], _: [String: Any]) throws in
      throw self.unsupportedError(feature: "SFTP upload")
    }
  }

  private func unsupportedResult(feature: String) -> [String: Any] {
    [
      "ok": false,
      "message": "\(feature) native transport for iOS is not wired yet. Add an implementation in modules/photo-sync-transport/ios.",
    ]
  }

  private func unsupportedError(feature: String) -> NSError {
    NSError(
      domain: "PhotoSyncTransport",
      code: 1001,
      userInfo: [NSLocalizedDescriptionKey: "\(feature) is not available on iOS in the current module implementation."]
    )
  }
}
