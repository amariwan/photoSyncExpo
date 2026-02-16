import { IconSymbol } from '@/components/ui/icon-symbol';
import { AppleColors, Radius, Spacing } from '@/constants/theme';
import type { RemoteFileEntry } from '@/types/photosync';
import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface FileBrowserProps {
    readonly currentPath: string;
    readonly files: RemoteFileEntry[];
    readonly isLoading: boolean;
    readonly onNavigate: (path: string) => void;
    readonly onSelectPath: (path: string) => void;
    readonly canSelectDirectories?: boolean;
}

export function FileBrowser({
    currentPath,
    files,
    isLoading,
    onNavigate,
    onSelectPath,
    canSelectDirectories = true,
}: FileBrowserProps) {
    const pathParts = currentPath.split('/').filter(Boolean);

    const handleNavigateUp = () => {
        if (pathParts.length > 0) {
            const parentPath = '/' + pathParts.slice(0, -1).join('/');
            onNavigate(parentPath === '/' ? '/' : parentPath);
        }
    };

    const handleSelectFile = (file: RemoteFileEntry) => {
        if (file.type === 'directory') {
            onNavigate(file.path);
        } else {
            onSelectPath(file.path);
        }
    };

    const handleSelectDirectory = (file: RemoteFileEntry) => {
        if (file.type === 'directory' && canSelectDirectories) {
            onSelectPath(file.path);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: AppleColors.background }}>
            {/* Breadcrumb Navigation */}
            <View
                style={{
                    paddingHorizontal: Spacing.lg,
                    paddingVertical: Spacing.md,
                    borderBottomColor: AppleColors.separator,
                    borderBottomWidth: 1,
                    backgroundColor: AppleColors.surfacePrimary,
                }}
            >
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity onPress={() => onNavigate('/')} style={{ marginRight: Spacing.sm }}>
                        <Text
                            style={{
                                fontSize: 14,
                                color: AppleColors.blue,
                                fontWeight: '600',
                            }}
                        >
                            /
                        </Text>
                    </TouchableOpacity>
                    {pathParts.map((part, index) => (
                        <View key={`${part}_${index}`} style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={{ color: AppleColors.tertiaryLabel, marginHorizontal: Spacing.xs }}>
                                /
                            </Text>
                            <TouchableOpacity
                                onPress={() => {
                                    const pathToNavigate = '/' + pathParts.slice(0, index + 1).join('/');
                                    onNavigate(pathToNavigate);
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 14,
                                        color: AppleColors.blue,
                                        fontWeight: '600',
                                    }}
                                >
                                    {part}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* File List */}
            {isLoading ? (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <ActivityIndicator size="large" color={AppleColors.accent} />
                </View>
            ) : files.length === 0 ? (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Text
                        style={{
                            fontSize: 15,
                            color: AppleColors.secondaryLabel,
                            textAlign: 'center',
                        }}
                    >
                        Empty Folder
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                        paddingHorizontal: Spacing.md,
                        paddingVertical: Spacing.md,
                    }}
                >
                    {currentPath !== '/' && (
                        <TouchableOpacity
                            onPress={handleNavigateUp}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: Spacing.md,
                                paddingHorizontal: Spacing.md,
                                backgroundColor: AppleColors.surfaceSecondary,
                                borderRadius: Radius.md,
                                marginBottom: Spacing.sm,
                            }}
                        >
                            <IconSymbol name="arrow.up" size={18} color={AppleColors.blue} />
                            <Text
                                style={{
                                    fontSize: 15,
                                    color: AppleColors.blue,
                                    marginLeft: Spacing.md,
                                    fontWeight: '600',
                                }}
                            >
                                Parent Folder
                            </Text>
                        </TouchableOpacity>
                    )}

                    {files.map((file) => (
                        <TouchableOpacity
                            key={file.path}
                            onPress={() => handleSelectFile(file)}
                            onLongPress={() => handleSelectDirectory(file)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: Spacing.md,
                                paddingHorizontal: Spacing.md,
                                backgroundColor: AppleColors.surfaceSecondary,
                                borderRadius: Radius.md,
                                marginBottom: Spacing.sm,
                            }}
                        >
                            <IconSymbol
                                name={file.type === 'directory' ? 'folder.fill' : 'doc.fill'}
                                size={20}
                                color={
                                    file.type === 'directory' ? AppleColors.orange : AppleColors.blue
                                }
                            />
                            <View style={{ flex: 1, marginLeft: Spacing.md }}>
                                <Text
                                    style={{
                                        fontSize: 15,
                                        color: AppleColors.label,
                                        fontWeight: '600',
                                    }}
                                    numberOfLines={1}
                                >
                                    {file.name}
                                </Text>
                                {file.size && (
                                    <Text
                                        style={{
                                            fontSize: 12,
                                            color: AppleColors.tertiaryLabel,
                                            marginTop: Spacing.xs,
                                        }}
                                    >
                                        {(file.size / 1024).toFixed(1)} KB
                                    </Text>
                                )}
                            </View>
                            {file.type === 'directory' && (
                                <IconSymbol
                                    name="chevron.right"
                                    size={16}
                                    color={AppleColors.tertiaryLabel}
                                />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}
