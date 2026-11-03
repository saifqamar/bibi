/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("@react-native-community/netinfo", () =>
  require("@react-native-community/netinfo/jest/netinfo-mock.js"),
);

// In-memory keychain for the session store.
jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(
      async (key: string, value: string) => void store.set(key, value),
    ),
    deleteItemAsync: jest.fn(async (key: string) => void store.delete(key)),
    __store: store,
  };
});

// Downloads write to a fake file system; each test can inspect the jest.fn calls.
jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///docs/",
  makeDirectoryAsync: jest.fn(async () => undefined),
  deleteAsync: jest.fn(async () => undefined),
  getInfoAsync: jest.fn(async () => ({
    exists: true,
    size: 9_600_000,
    isDirectory: false,
  })),
  createDownloadResumable: jest.fn((url: string, fileUri: string) => ({
    downloadAsync: jest.fn(async () => ({
      uri: fileUri,
      status: 200,
      headers: {},
      mimeType: "audio/mpeg",
    })),
    resumeAsync: jest.fn(async () => ({
      uri: fileUri,
      status: 200,
      headers: {},
      mimeType: "audio/mpeg",
    })),
    pauseAsync: jest.fn(async () => ({
      url,
      fileUri,
      options: {},
      resumeData: "resume",
    })),
    savable: jest.fn(() => ({
      url,
      fileUri,
      options: {},
      resumeData: "resume",
    })),
  })),
}));
