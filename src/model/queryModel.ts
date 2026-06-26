import mongoose, { Schema, Document } from 'mongoose';


// Attachment type
interface Attachment {
  originalname: string;
  filename: string;
  location: string;
}

// Conversation interface
interface Conversation {
  sender: string;
  roleId: string;
  message: string;
  timestamp: Date;
    attachments?: Attachment[]; 

}

// Query interface extending mongoose Document
interface Query extends Document {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  subject: string;
  message: string;
  status: string;
  conversation: Conversation[];
  attachments: string[];
}

// Conversation Schema
const ConversationSchema: Schema = new Schema({
  sender: {
    type: String,
    ref: "User",
    required: true,
  },
  message: {
    type: String,
    required: true
  },
  roleId: {
    type: String,
    ref: "roleMaster",
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
}, { _id: false });

// Query Schema
const QuerySchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    ref: "User",
    required: true,
  },
  userEmail: {
    type: String,
    required: true,
  },
  userRole: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'Open'
  },
  conversation: [ConversationSchema],
  attachments: {
    type: [String],
    default: []
  }
}, { versionKey: false, timestamps: true });

export default mongoose.model<Query>('QueryList', QuerySchema, 'queryList');