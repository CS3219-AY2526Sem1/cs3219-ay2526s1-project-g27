/*
AI Assistance Disclosure:
Tool: ChatGPT (model: GPT‑5) date: 2025‑10‑2
Scope: 
- Generated initial code
Author review: 
- Verfied for correctness by reading code
*/

import { MongoClient } from 'mongodb'
import * as Y from 'yjs'

const MONGO_URL = process.env.DB_LOCAL_URI || 'mongodb://persistence:27017'
const DB_NAME = process.env.YJS_DB_NAME || 'yjs-docs'
const COLLECTION_NAME = process.env.YJS_COLLECTION_NAME || 'documents'
let db = null
let collection = null

const connectToMongo = async () => {
    if (collection) return collection
    const client = new MongoClient(MONGO_URL)
    await client.connect()
    db = client.db(DB_NAME)
    collection = db.collection(COLLECTION_NAME)
    await collection.createIndex({ docName: 1 }, { unique: true })
    return collection
}

/**
 * Save the Yjs document state to MongoDB
 * @param {string} docName
 * @param {Y.Doc} doc
 * @returns {Promise<void>}
 */
const writeState = async (docName, doc) => {
    console.log(`Writing ${docName}`)
    const collection = await connectToMongo()
    const update = Y.encodeStateAsUpdate(doc)
    await collection.updateOne(
        { docName },
        { $set: { docName, update: Buffer.from(update) } },
        { upsert: true }
    )
}

/**
 * Load a document from MongoDB and apply it to the Yjs document
 * @param {string} docName
 * @param {Y.Doc} doc
 * @returns {Promise<void>}
 */
const bindState = async (docName, doc) => {
    console.log(`Requesting: ${docName}`)
    const collection = await connectToMongo()
    const entry = await collection.findOne({ docName })
    if (entry && entry.update) {
        const update = new Uint8Array(entry.update.buffer, entry.update.byteOffset, entry.update.byteLength)
        Y.applyUpdate(doc, update)
    }
}

export const mongoPersistence = {
    bindState,
    writeState,
    provider: null, // optional
}