import nodemailer from 'nodemailer';
import { SentMessageInfo } from 'nodemailer';
import { EMAIL_SERVICE, EMAIL_PASS, EMAIL_USER } from '../config';

interface MailOptions {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

const transporter = nodemailer.createTransport({
  service: EMAIL_SERVICE,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});


export const sendEmail = async (
  mailOptions: MailOptions
): Promise<{ success: boolean; info?: SentMessageInfo; error?: any }> => {
  try {
    const completeMailOptions = {
      ...mailOptions,
      from: mailOptions.from || EMAIL_USER,
    };

    const info = await transporter.sendMail(completeMailOptions);
    console.log('Email sent successfully to:', mailOptions.to);
    return { success: true, info };
  } catch (error) {
    console.error('Email sending failed to:', mailOptions.to, error);
    return { success: false, error };
  }
};


export const verifyEmailConnection = async (): Promise<boolean> => {
  try {
    await transporter.verify();
    console.log('Email server connection verified');
    return true;
  } catch (error) {
    console.error('Email server connection failed:', error);
    return false;
  }
};