import { validateVapiSecret } from '../utils/auth.js';
import Task from '../models/Task.js';
import { sendTaskCreatedEmail, sendTrelloCardCreatedEmail } from '../utils/email.js';

export default async function messagesRoutes(fastify) {
  // Messages webhook to receive server messages from Vapi
  // fastify.post('/messages', async (request, reply) => {
  //   // if (!validateVapiSecret(request, reply)) {
  //   //   return;
  //   // }

  //   console.log('received request', request.body);
  //   const { message } = request.body;
  //   if (!message || !message.type) {
  //     reply.code(400).send({ error: 'Invalid message format' });
  //     return;
  //   }

  //   switch (message.type) {
  //     case 'status-update':
  //       console.log('Status update received:', message.status);
  //       if (message.status === 'ended') {
  //         console.log('Call ended reason:', message.endedReason);
  //         console.log('Call details:', message.call);
  //       }
  //       break;

  //     case 'transcript':
  //       console.log('Transcript received:', message.transcript);
  //       break;

  //     case 'model-output':
  //       console.log('Model output received:', message.output);
  //       break;

  //     case 'end-of-call-report':
  //       console.log('End of call report received:', message.report);
  //       break;

  //     case 'transfer-destination-request':
  //       const transferDestination = process.env.TRANSFER_DESTINATION;
  //       console.log('Transferring to destination:', transferDestination);
  //       return {
  //         destination: {
  //           type: 'number',
  //           message: 'Connecting you to our support line.',
  //           number: transferDestination,
  //         },
  //       };

  //     default:
  //       console.log('Received message type:', message.type);
  //   }

  //   return {
  //     success: true,
  //     message: `Processed ${message.type} message`,
  //   };
  // });

  fastify.post('/messages', async (request, reply) => {
    const { message } = request.body;
  
    if (!message || message.type !== 'tool-calls') {
      return reply.code(400).send({ error: 'Invalid message format' });
    }
  
    // Assuming only one tool call per message
    const toolCall = message.toolCalls?.[0];
    if (!toolCall) {
      return reply.code(400).send({ error: 'No tool call found' });
    }
  
    const toolCallId = toolCall.id;
  
    // Parse the arguments object (it may already be an object)
    let args = toolCall.function.arguments;
    if (typeof args === 'string') {
      args = JSON.parse(args);
    }
  
    // Only pick the required fields
    const { title, description, priority, dueDate } = args;
  
    request.log.info({ title, description, priority, dueDate }, 'Tool called with args');
  
    try {
      // Create a new task in MongoDB
      const taskData = {
        title,
        description: description || '',
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
      };

      const createdTask = await Task.create(taskData);
      request.log.info({ taskId: createdTask._id }, 'Task saved to MongoDB');
  
      // Send email notification
      try {
        await sendTaskCreatedEmail(createdTask._id.toString(), taskData);
        request.log.info('Email notification sent successfully');
      } catch (emailError) {
        // Log email error but don't fail the request
        request.log.error({ error: emailError }, 'Failed to send email notification');
      }
  
      // Respond in Vapi expected format
      return reply.send({
        results: [
          {
            toolCallId,
            result: `Task created successfully with ID ${createdTask._id}`,
          },
        ],
      });
    } catch (error) {
      request.log.error({ error }, 'Error saving task to MongoDB');
      return reply.code(500).send({
        results: [
          {
            toolCallId,
            result: `Error creating task: ${error.message}`,
          },
        ],
      });
    }
  });

  // Create Trello ticket route
  fastify.post('/createTrelloTicket', async (request, reply) => {
    const { message } = request.body;
  
    if (!message || message.type !== 'tool-calls') {
      return reply.code(400).send({ error: 'Invalid message format' });
    }
  
    // Assuming only one tool call per message
    const toolCall = message.toolCalls?.[0];
    if (!toolCall) {
      return reply.code(400).send({ error: 'No tool call found' });
    }
  
    const toolCallId = toolCall.id;
  
    // Parse the arguments object (it may already be an object)
    let args = toolCall.function.arguments;
    if (typeof args === 'string') {
      args = JSON.parse(args);
    }
  
    // Extract the required fields
    const { name, desc, dueDate } = args;
  
    if (!name) {
      return reply.code(400).send({
        results: [
          {
            toolCallId,
            result: `Error: Name is required`,
          },
        ],
      });
    }
  
    // Get Trello credentials from environment variables
    const trelloToken = process.env.TRELLO_TOKEN;
    const trelloKey = process.env.TRELLO_KEY;
    const trelloIdList = process.env.TRELLO_ID_LIST;
  
    if (!trelloToken || !trelloKey || !trelloIdList) {
      return reply.code(500).send({
        results: [
          {
            toolCallId,
            result: `Error: Trello configuration is missing. Please check your .env file.`,
          },
        ],
      });
    }
  
    try {
      // Build URL with query parameters
      const url = new URL('https://api.trello.com/1/cards');
      url.searchParams.append('idList', trelloIdList);
      url.searchParams.append('key', trelloKey);
      url.searchParams.append('token', trelloToken);
  
      // Build form data
      const formData = new URLSearchParams();
      formData.append('name', name);
      if (desc) {
        formData.append('desc', desc);
      }
      if (dueDate) {
        formData.append('due', dueDate);
      }
      formData.append('pos', 'bottom');
  
      request.log.info({ formData: formData.toString(), url: url.toString() }, 'Creating Trello card');
  
      // Make API call to Trello
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });
  
  
      if (!response.ok) {
        const errorText = await response.text();
        return reply.code(response.status).send({
          results: [
            {
              toolCallId,
              result: `Error creating Trello card: ${errorText}`,
            },
          ],
        });
      }
  
      const cardData = await response.json();
      request.log.info({ cardId: cardData.id }, 'Trello card created successfully');
  
      // Send email notification
      try {
        await sendTrelloCardCreatedEmail(cardData.id, { name, desc, dueDate });
        request.log.info('Email notification sent successfully');
      } catch (emailError) {
        // Log email error but don't fail the request
        request.log.error({ error: emailError }, 'Failed to send email notification');
      }
  
      // Respond in Vapi expected format
      return reply.send({
        results: [
          {
            toolCallId,
            result: 'Task created successfully',
          },
        ],
      });
    } catch (error) {
      request.log.error({ error }, 'Error creating Trello card');
      return reply.code(500).send({
        results: [
          {
            toolCallId,
            result: `Error creating Trello card: ${error.message}`,
          },
        ],
      });
    }
  });
  
}
