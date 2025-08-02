export interface StorageReference {
  fullPath: string;
  name: string;
}

export interface UploadResult {
  ref: StorageReference;
  metadata: {
    name: string;
    fullPath: string;
    size: number;
    timeCreated: string;
  };
}

class MockStorageService {
  private files: Map<string, { blob: Blob; url: string; metadata: any }> = new Map();

  ref(path: string): StorageReference {
    return {
      fullPath: path,
      name: path.split('/').pop() || ''
    };
  }

  async uploadBytes(ref: StorageReference, blob: Blob): Promise<UploadResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const url = URL.createObjectURL(blob);
        const metadata = {
          name: ref.name,
          fullPath: ref.fullPath,
          size: blob.size,
          timeCreated: new Date().toISOString()
        };

        this.files.set(ref.fullPath, { blob, url, metadata });

        resolve({
          ref,
          metadata
        });
      }, 1000); // Simulate upload delay
    });
  }

  async getDownloadURL(ref: StorageReference): Promise<string> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const file = this.files.get(ref.fullPath);
        if (file) {
          resolve(file.url);
        } else {
          reject(new Error('File not found'));
        }
      }, 200);
    });
  }
}

export const mockStorage = new MockStorageService();