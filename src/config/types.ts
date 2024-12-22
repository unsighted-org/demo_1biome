import { Document, ObjectId } from 'mongodb';

export interface InMemoryCollection {
  findOne(filter: Document): Promise<Document | null>;
  find(filter: Document): Promise<Document[]>;
  insertOne(doc: Document): Promise<{ insertedId: ObjectId }>;
  insertMany(docs: Document[]): Promise<{ insertedIds: ObjectId[] }>;
  updateOne(filter: Document, update: Document): Promise<{ modifiedCount: number; acknowledged: boolean }>;
  updateMany(filter: Document, update: Document): Promise<{ modifiedCount: number; acknowledged: boolean }>;
  deleteOne(filter: Document): Promise<{ deletedCount: number }>;
  deleteMany(filter: Document): Promise<{ deletedCount: number }>;
  countDocuments(filter: Document): Promise<number>;
}
