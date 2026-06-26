import { Router } from 'express';
import { drive_v3, google } from 'googleapis';
import fs from 'fs';
import { CustomRequest, EMAIL_PASSWORD, EMAIL_USERNAME, generateUniqueId, Messages, StatusCodes } from '../config';
import accessManagerModel from '../model/accessManagerModel';
import { authenticateJWT } from '../controller/authController';
import nodemailer from 'nodemailer';


const router = Router();
interface IFile {
    id: string;
    name: string;
    webViewLink?: string;
}

// Load service account credentials
const credentials = JSON.parse(fs.readFileSync('service-account.json', 'utf8'));

// Configure Google Drive API
const auth = new google.auth.JWT(
    credentials.client_email,
    undefined,
    credentials.private_key,
    ['https://www.googleapis.com/auth/drive'] // Scope for full Drive access
);

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: "nitinkvishvakarma@gmail.com", 
        pass: "bkfr kaft vdds oyru"
    }
});

const drive = google.drive({ version: 'v3', auth });
// console.log("drive ==> ",drive);

router.use(authenticateJWT);

// Route to fetch folders
router.get('/folders', async (req, res) => {
    try {
        console.log("Inside of /folders ==> ");
        const response = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder'",
            fields: 'files(id, name)',
        });
        console.log("response ==> ", response.data);


        res.status(200).json(response.data.files);
    } catch (error) {
        console.error('Error fetching folders:', error); // Log full error
        res.status(500).json({ error: 'Failed to fetch folders.' });
    }
});


// router.post('/remove-access', async (req: CustomRequest, res) => {
//     const { folderId, folderName, userEmails, users } = req.body;
//     if (!req.payload) {
//         return res.status(StatusCodes.UNAUTHORIZED).json({ message: Messages.PAYLOAD_MISSING_OR_INVALID, });
//     }
//     const { userId: adminId, roleName } = req.payload

//     console.log("req.body ==> ", req.body)
//     try {
//         const permissions: any = await drive.permissions.list({
//             fileId: folderId,
//             fields: 'permissions(id, emailAddress)',
//         });

//         // Loop through permissions and remove those for specified users
//         const promises = userEmails.map((email: string) => {
//             const permission = permissions.data.permissions.find((p: any) => p.emailAddress === email);
//             if (permission) {
//                 return drive.permissions.delete({
//                     fileId: folderId,
//                     permissionId: permission.id,
//                 });
//             }
//         });

//         await Promise.all(promises);

//         const uniqueId = await generateUniqueId(accessManagerModel, "GDA");
//         console.log("folderMembers ==> ", users)
//         const data = {
//             id: uniqueId,
//             folderId,
//             folderName,
//             email: userEmails,
//             userInformation: users,
//             grantedBy: adminId,
//             actionDate: Date.now(),
//             actionType: 'removed',
//             createdBy: adminId,
//             createrRole: roleName,
//             updatedBy: adminId,
//             updaterRole: roleName,
//         }

//         const result = await accessManagerModel.create(data);
//         if (result) {
//             console.log("Access Removed !");
//             res.status(StatusCodes.CREATED).json({ message: 'Removed access for users' });
//         }

//     } catch (error) {
//         res.status(500).send('Error removing access');
//     }
// });


router.post('/remove-access', async (req: CustomRequest, res) => {
    const { folderId, folderName, userEmails, users } = req.body;
    if (!req.payload) {
        return res.status(StatusCodes.UNAUTHORIZED).json({ message: Messages.PAYLOAD_MISSING_OR_INVALID, });
    }
    const { userId: adminId, roleName } = req.payload

    console.log("req.body ==> ", req.body)
    try {
        const permissions: any = await drive.permissions.list({
            fileId: folderId,
            fields: 'permissions(id, emailAddress)',
        });

        // Loop through permissions and remove those for specified users
        const promises = userEmails.map((email: string) => {
            const permission = permissions.data.permissions.find((p: any) => p.emailAddress === email);
            if (permission) {
                return drive.permissions.delete({
                    fileId: folderId,
                    permissionId: permission.id,
                });
            }
        });

        await Promise.all(promises);

        const uniqueId = await generateUniqueId(accessManagerModel, "GDA");
        console.log("folderMembers ==> ", users)
        const data = {
            id: uniqueId,
            folderId,
            folderName,
            email: userEmails,
            userInformation: users,
            grantedBy: adminId,
            actionDate: Date.now(),
            actionType: 'removed',
            createdBy: adminId,
            createrRole: roleName,
            updatedBy: adminId,
            updaterRole: roleName,
        }

        const result = await accessManagerModel.create(data);

        if (result) {
            console.log("Access Removed !");

            // Send email notification to each user
            const emailPromises = userEmails.map((email: string) => {
                const mailOptions = {
                    from: 'nitin.vishvakarma@vectedtech.com',
                    to: email,
                    subject: 'Action Required: Class Access Revoked Due to Uninformed Absence',
                    html: `
                        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
                            <p>Dear Student,</p>
                            
                            <p>I hope this email finds you well.</p>
                            
                            <p>This is to inform you that your access to <strong>${folderName}</strong> has been removed by Vector Skill Academy as per your performance and recent absentees in the classes.</p>
                            
                            <p>Our records indicate that you have not attended your classes for the past few days, and the management team has not received any prior communication regarding your absence. As a result, your mentor has temporarily revoked your access to attend classes.</p>
                            
                            <p>We kindly request you to get in touch with the Operations Team at VSA at your earliest convenience to resolve the matter and regain your access.</p>
                            
                            <p>Moving forward, please ensure that you inform the Operations Team in advance if you are unable to attend any session.</p>
                            
                            <p>Best regards,<br>
                            Shreyans Kale<br>
                            Operations Head | VSA</p>
                        </div>
                    `
                };

                return transporter.sendMail(mailOptions);
            });

            await Promise.all(emailPromises);

            res.status(StatusCodes.CREATED).json({ message: 'Removed access for users and notifications sent' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Error removing access');
    }
});

router.get('/folder-members', async (req, res) => {
    const { folderId } = req.query;
    // Ensure folderId is a string
    if (typeof folderId !== 'string') {
        return res.status(400).json({ error: 'folderId must be a string' });
    }

    try {
        const drive: drive_v3.Drive = google.drive({ version: 'v3', auth });

        // Fetch permissions for the folder
        const result = await drive.permissions.list({
            fileId: folderId, // Ensure fileId is a string
            fields: 'permissions(id, emailAddress, role)',
        });

        // Extract relevant data (email and role)
        const members = result.data.permissions?.map((permission: any) => ({
            email: permission.emailAddress,
            role: permission.role,
        })) || [];

        // Send the response
        res.status(200).json(members);
    } catch (error) {
        console.error('Error fetching folder members:', error);
        res.status(500).json({ error: 'Failed to fetch folder members' });
    }
});


// router.post("/provide-access", async (req: CustomRequest, res) => {
//     try {
//         const { folderId, folderName, users, role, accessExpiresTime: expirationDate } = req?.body;
//         if (!req.payload) {
//             return res.status(StatusCodes.UNAUTHORIZED).json({ message: Messages.PAYLOAD_MISSING_OR_INVALID, });
//         }
//         const { userId: adminId, roleName } = req.payload

//         console.log("req?.body inside access provider ==> ", req.body);

//         const permissionPromises = users.map(async (email: string) => {
//             try {
//                 // Fetch current permissions for the folder
//                 const { data: { permissions } } = await drive.permissions.list({
//                     fileId: folderId,
//                     fields: 'permissions(id,emailAddress,role)'
//                 });

//                 // Find if the user already has access
//                 const existingPermission = permissions?.find((perm: any) => perm.emailAddress === email);

//                 if (existingPermission?.id) {
//                     // Update the role if the user already has access
//                     console.log(`Updating role for ${email}`);
//                     await drive.permissions.update({
//                         fileId: folderId,
//                         permissionId: existingPermission.id,
//                         requestBody: {
//                             role: role // Update to the new role
//                         },
//                     });
//                     console.log(`Role updated for ${email}:`, existingPermission.id);
//                 } else {
//                     // Create new permission if the user doesn't already have access
//                     console.log(`Granting access to ${email}`);
//                     await drive.permissions.create({
//                         fileId: folderId,
//                         requestBody: {
//                             type: "user",
//                             role: role,
//                             emailAddress: email
//                         },
//                     });
//                     console.log(`Access granted to ${email}`);
//                 }
//             } catch (error) {
//                 console.error(`Error processing ${email}:`, error);
//             }
//         });

//         await Promise.all(permissionPromises);

//         const uniqueId = await generateUniqueId(accessManagerModel, "GDA");

//         console.log("users ", users)

//         const data = {
//             id: uniqueId,
//             folderId,
//             folderName,
//             email: users,
//             role,
//             grantedBy: adminId,
//             actionDate: Date.now(),
//             actionType: 'granted',
//             expirationDate,
//             createdBy: adminId,
//             createrRole: roleName,
//             updatedBy: adminId,
//             updaterRole: roleName,
//         }

//         const result = await accessManagerModel.create(data);

//         if (result) {
//             console.log("All permissions processed");
//             res.status(200).json({ message: 'Access provided successfully' });
//         }

//     } catch (error: unknown) {
//         console.error('Error providing access:', error);
//         res.status(500).json({ message: 'Failed to provide access' });
//     }
// });

router.post("/provide-access", async (req: CustomRequest, res) => {
    try {
        const { folderId, folderName, users, role, accessExpiresTime: expirationDate } = req?.body;
        if (!req.payload) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: Messages.PAYLOAD_MISSING_OR_INVALID, });
        }
        const { userId: adminId, roleName } = req.payload;

        console.log("req?.body inside access provider ==> ", req.body);

        const permissionPromises = users.map(async (email: string) => {
            try {
                // Existing permission handling code...
                const { data: { permissions } } = await drive.permissions.list({
                    fileId: folderId,
                    fields: 'permissions(id,emailAddress,role)'
                });

                const existingPermission = permissions?.find((perm: any) => perm.emailAddress === email);

                if (existingPermission?.id) {
                    await drive.permissions.update({
                        fileId: folderId,
                        permissionId: existingPermission.id,
                        requestBody: {
                            role: role
                        },
                    });
                } else {
                    await drive.permissions.create({
                        fileId: folderId,
                        requestBody: {
                            type: "user",
                            role: role,
                            emailAddress: email
                        },
                    });
                }
            } catch (error) {
                console.error(`Error processing ${email}:`, error);
            }
        });

        await Promise.all(permissionPromises);

        const uniqueId = await generateUniqueId(accessManagerModel, "GDA");

        const data = {
            id: uniqueId,
            folderId,
            folderName,
            email: users,
            role,
            grantedBy: adminId,
            actionDate: Date.now(),
            actionType: 'granted',
            expirationDate,
            createdBy: adminId,
            createrRole: roleName,
            updatedBy: adminId,
            updaterRole: roleName,
        }

        const result = await accessManagerModel.create(data);

        if (result) {
            // ========== ADDED EMAIL NOTIFICATION LOGIC ==========
            const emailPromises = users.map(async (email: string) => {
                const mailOptions = {
                    from: 'operations@vectorskillacademy.com',
                    to: email,
                    subject: `Access Granted: ${folderName}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
                            <p>Dear User,</p>
                            
                            <p>You have been granted <strong>${role}</strong> access to the folder: 
                            <strong>${folderName}</strong> at Vector Skill Academy.</p>
                            
                            ${expirationDate ? 
                              `<p>This access will expire on: <strong>${new Date(expirationDate).toLocaleDateString()}</strong></p>` 
                              : ''}
                            
                            <p>Please contact the Operations Team if you have any questions.</p>
                            
                            <p>Best regards,<br>
                            Operations Team<br>
                            Vector Skill Academy</p>
                        </div>
                    `
                };
                
                try {
                    await transporter.sendMail(mailOptions);
                    console.log(`Access grant email sent to ${email}`);
                } catch (emailError) {
                    console.error(`Failed to send email to ${email}:`, emailError);
                }
            });

            await Promise.all(emailPromises);

            console.log("All permissions processed and notifications sent");
            res.status(200).json({ message: 'Access provided successfully' });
        }

    } catch (error: unknown) {
        console.error('Error providing access:', error);
        res.status(500).json({ message: 'Failed to provide access' });
    }
});

router.get("/list-users", async (req: any, res: any) => {
    try {
        const folderId = req.query.folderId; // Correctly extract folderId from query parameters

        // Check if folderId exists
        console.log("folderId ==> ", folderId);


        // Make the API call to list permissions for the folder
        const { data: { permissions } } = await drive.permissions.list({
            fileId: folderId,
            fields: "permissions(id,emailAddress,role)",
        });

        const usersWithAccess = permissions?.filter((permission: any) => permission.emailAddress);  // Filter to ensure only valid emails
        console.log("Users with access:", usersWithAccess);
        console.log("usersWithAccess ==> ", usersWithAccess);

        res.status(200).json({
            message: "Users with access retrieved successfully",
            users: usersWithAccess,
        });
    } catch (error: unknown) {
        console.error("Error fetching users with access:", error);
        res.status(500).json({ message: "Failed to fetch users with access" });
    }
});

router.get('/getFolders', async (req, res) => {
    const { email } = req.body;

    try {
        const folders = await getFoldersWithAccess(email);
        res.status(200).json({ folders, count: folders });
    } catch (error: unknown) {
        res.status(500).json({ error: error });
    }
});



router.get("/access-logs", async (req, res) => {
    try {
        console.log("Inside /access-logs")
        const accessLogs = await accessManagerModel.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "createdBy",
                    foreignField: "id",
                    as: "supportAdmin",
                },
            },
            {
                $unwind: {
                    path: "$supportAdmin",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $addFields: {
                    supportAdminId: "$supportAdmin.id",
                    supportAdminName: {
                        $cond: {
                            if: { $gt: [{ $strLenCP: "$supportAdmin.lastName" }, 0] },
                            then: { $concat: ["$supportAdmin.firstName", " ", "$supportAdmin.lastName"] },
                            else: "$supportAdmin.firstName",
                        },
                    },
                },
            },
            {
                $project: {
                    granterUser: 0, // Exclude lookup data to keep response clean
                    _id: 0,
                },
            },
        ]);

        console.log("accessLogs ", accessLogs)

        res.status(200).json({ accessLogs });
    } catch (error: unknown) {
        res.status(500).json({ error: (error as Error).message });
    }
});






const getFoldersWithAccess = async (email: string): Promise<number> => {
    try {

        const response = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.folder'",
            fields: 'files(id, name)',
        });
        console.log("response ==> ", response.data);

        // Replace with actual API call using the correct Google Drive SDK method
        // const res = await drive.permissions.list({
        //     fileId: 'root', // Check the root folder (or change to any specific folder ID)
        //     fields: 'permissions(id,emailAddress,role)',
        // });

        // // Check if permissions exist in the response and filter them
        // const permissions = res?.data?.permissions;
        //  console.log("res inside getFoldersWithAccess ==> ",res.data);
        // if (!permissions) {
        //     console.log('No permissions data found');
        //     return 0; // Return 0 if no permissions are available
        // }

        // // Filter the permissions to get the folders shared with the specified email
        // const folders = permissions.filter(permission => permission.emailAddress == email);

        // console.log(`Found ${folders.length} folders shared with ${email}`);
        // folders.forEach(folder => {
        //     console.log(`Folder ID: ${folder.id}, Role: ${folder.role}`);
        // });

        return 0; // Return the count of folders shared with the email
    } catch (error) {
        console.error('Error fetching folders:', error);
        throw new Error('Failed to fetch folder details');
    }
};

// Add to server.ts
router.get('/documents', async (req: Request, res: any) => {
    try {
        // Validate environment variable
        console.log("Inside /documents api ")
        const folderId = '1l5o21tGX_vQ0UdAkfZX33qc1jApb5z65'; // Consider moving to env var
        if (!folderId) {
            return res.status(400).json({ error: 'Google Drive folder ID not configured' });
        }

        // Get files from Google Drive
        const response = await drive.files.list({
            q: `'${folderId}' in parents and mimeType != 'application/vnd.google-apps.folder'`,
            fields: 'files(id, name, webViewLink, mimeType, createdTime)',
            orderBy: 'createdTime desc',
            pageSize: 100,
        });

        console.log("Inside /documents api response ", response.data.files)

        // Type guard for response data
        if (!response.data.files) {
            return res.status(404).json({ error: 'No files found in the specified folder' });
        }

        res.json(response.data.files);
    } catch (err: unknown) {
        const error = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

router.get('/recordings', async (req: Request, res: any) => {
    try {
        // Real implementation
        const response = await drive.files.list({
            q: `'190aMgS36bSlVX20tppcf5vkbiKc5fg0L' in parents`,
            fields: 'files(id, name, webViewLink)'
        });
        const files = response.data.files;
        res.json(files);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
