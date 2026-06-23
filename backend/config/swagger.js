import swaggerJSDoc from 'swagger-jsdoc';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CRDMS API Reference',
      version: '1.0.0',
      description: 'Production-ready Candidate Relationship Database Management System (CRDMS) API documentation.',
      contact: {
        name: 'CRDMS DevOps Team',
        email: 'devops@crdms.com'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:5000',
        description: 'Target API Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js', './server.js'] // Target comments in routes and controllers
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

export default swaggerSpec;
