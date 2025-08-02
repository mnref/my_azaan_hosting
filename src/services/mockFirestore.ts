export interface DocumentData {
  [field: string]: any;
}

export interface DocumentReference {
  id: string;
  path: string;
}

export interface CollectionReference {
  path: string;
}

class MockFirestoreService {
  private collections: Map<string, Map<string, DocumentData>> = new Map();

  constructor() {
    // Load data from localStorage
    const savedData = localStorage.getItem('mockFirestore_data');
    if (savedData) {
      const data = JSON.parse(savedData);
      this.collections = new Map(
        Object.entries(data).map(([collectionPath, docs]: [string, any]) => [
          collectionPath,
          new Map(Object.entries(docs))
        ])
      );
    }
  }

  private saveData() {
    const data: any = {};
    this.collections.forEach((docs, collectionPath) => {
      data[collectionPath] = Object.fromEntries(docs);
    });
    localStorage.setItem('mockFirestore_data', JSON.stringify(data));
  }

  collection(path: string): CollectionReference {
    return { path };
  }

  async addDoc(collection: CollectionReference, data: DocumentData): Promise<DocumentReference> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const docId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const docData = {
          ...data,
          id: docId,
          createdAt: new Date().toISOString()
        };

        if (!this.collections.has(collection.path)) {
          this.collections.set(collection.path, new Map());
        }

        this.collections.get(collection.path)!.set(docId, docData);
        this.saveData();

        resolve({
          id: docId,
          path: `${collection.path}/${docId}`
        });
      }, 300);
    });
  }

  async getDocs(collection: CollectionReference): Promise<DocumentData[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const docs = this.collections.get(collection.path);
        if (docs) {
          resolve(Array.from(docs.values()));
        } else {
          resolve([]);
        }
      }, 200);
    });
  }
}

export const mockFirestore = new MockFirestoreService();