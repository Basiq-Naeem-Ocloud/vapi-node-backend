import nodemailer from 'nodemailer';
import { logger } from './logger.js';

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  // Validate required environment variables
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email configuration is missing. Please check your .env file.');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: `${process.env.EMAIL_USER}`,
      pass: `${process.env.EMAIL_PASS}`,
    },
  });
};

export async function sendTaskCreatedEmail(taskId, taskData) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `${process.env.EMAIL_USER}`,
      to: process.env.EMAIL_RECIPIENT,
      subject: 'A Support Ticket is Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Support Ticket Created</h2>
          <p>Hello,</p>
          <p>A new support ticket has been created in the system.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">Ticket Details:</h3>
            <p><strong>Title:</strong> ${taskData.title}</p>
            ${taskData.description ? `<p><strong>Description:</strong> ${taskData.description}</p>` : ''}
            ${taskData.priority ? `<p><strong>Priority:</strong> ${taskData.priority}</p>` : ''}
            ${taskData.dueDate ? `<p><strong>Due Date:</strong> ${new Date(taskData.dueDate).toLocaleDateString()}</p>` : ''}
          </div>
          
          <p style="margin-top: 30px;"><strong>Ticket ID:</strong> <span style="color: #0066cc; font-size: 18px;">${taskId}</span></p>
          
          <p style="margin-top: 30px; color: #666;">Thank you for using our support system.</p>
        </div>
      `,
      text: `
Support Ticket Created

Hello,

A new support ticket has been created in the system.

Ticket Details:
Title: ${taskData.title}
${taskData.description ? `Description: ${taskData.description}` : ''}
${taskData.priority ? `Priority: ${taskData.priority}` : ''}
${taskData.dueDate ? `Due Date: ${new Date(taskData.dueDate).toLocaleDateString()}` : ''}

Ticket ID: ${taskId}

Thank you for using our support system.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info({ messageId: info.messageId }, 'Email sent successfully');
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error({ error }, 'Error sending email');
    throw error;
  }
}

export async function sendTrelloCardCreatedEmail(cardId, cardData) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `${process.env.EMAIL_USER}`,
      to: process.env.EMAIL_RECIPIENT,
      subject: 'A Trello Card is Created',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Trello Card Created</h2>
          <p>Hello,</p>
          <p>A new Trello card has been created in the system.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #555;">Card Details:</h3>
            <p><strong>Name:</strong> ${cardData.name}</p>
            ${cardData.desc ? `<p><strong>Description:</strong> ${cardData.desc}</p>` : ''}
            ${cardData.dueDate ? `<p><strong>Due Date:</strong> ${new Date(cardData.dueDate).toLocaleDateString()}</p>` : ''}
          </div>
          
          <p style="margin-top: 30px;"><strong>Card ID:</strong> <span style="color: #0066cc; font-size: 18px;">${cardId}</span></p>
          
          <p style="margin-top: 30px; color: #666;">Thank you for using our support system.</p>
        </div>
      `,
      text: `
Trello Card Created

Hello,

A new Trello card has been created in the system.

Card Details:
Name: ${cardData.name}
${cardData.desc ? `Description: ${cardData.desc}` : ''}
${cardData.dueDate ? `Due Date: ${new Date(cardData.dueDate).toLocaleDateString()}` : ''}

Card ID: ${cardId}

Thank you for using our support system.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info({ messageId: info.messageId }, 'Email sent successfully');
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error({ error }, 'Error sending email');
    throw error;
  }
}

