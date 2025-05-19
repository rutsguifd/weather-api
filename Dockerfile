FROM node:22-slim
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npx prisma generate && npm run build
EXPOSE 3000
CMD ["sh", "-c", "npm run migrate && npm run start"]