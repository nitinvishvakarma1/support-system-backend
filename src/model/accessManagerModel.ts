import mongoose, { Document, Schema } from 'mongoose';

interface IGoogleDriveAccess extends Document {
    id: string;
    folderId: string;
    folderName: string;
    email: string[];
    role?: string;
    userInformation: [];
    grantedBy: string;
    actionDate: Date;
    actionType: 'granted' | 'removed';
    expirationDate?: Date;
    createdBy: string;
    updatedBy: string;
    createrRole: string;
    updaterRole: string
}

const googleDriveAccessSchema: Schema = new Schema(
    {
        id: { type: String, required: true },
        folderId: { type: String, required: true },
        folderName: { type: String, required: true },
        email: { type: [String], required: true },
        role: { type: String, required: false },
        userInformation: { type: Array, required: false },
        grantedBy: { type: String, required: true },
        actionDate: { type: Date, default: Date.now },
        actionType: { type: String, enum: ['granted', 'removed'], required: true },
        expirationDate: { type: Date, required: false },
        createdBy: {
            type: String,
            default: "",
            ref: "User",
        },
        updatedBy: {
            type: String,
            default: "",
            ref: "User",
        },
        createrRole: {
            type: String,
            default: "",
            ref: "roleMaster",
        },
        updaterRole: {
            type: String,
            default: "",
            ref: "roleMaster",
        },

    },
    {
        versionKey: false,
    }
);

export default mongoose.model<IGoogleDriveAccess>('GoogleDriveAccessManager', googleDriveAccessSchema, 'GoogleDriveAccessManager');
;
