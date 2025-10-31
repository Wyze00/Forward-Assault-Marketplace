import { PrismaClient } from "@prisma/client";

export class PrismaService {

    private static prismaClientInstance: PrismaClient;

    static getInstance(): PrismaClient {
        if (!this.prismaClientInstance) {
            this.prismaClientInstance = new PrismaClient();
        }
        return this.prismaClientInstance;
    }
}