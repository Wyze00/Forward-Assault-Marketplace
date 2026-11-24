import { Camo, ItemType } from "~~/prisma/generated/client";
import { ApiResponse } from "..";

export interface GetCamoResponse extends ApiResponse<Camo[]> {};

export interface PostCamoRequest {
    itemType: ItemType;
    camoID: number;
    camoName: string;
}

export interface PutCamoRequest {
    uuid: string;
    itemType?: ItemType;
    camoID?: number;
    camoName?: string;
}

export interface DeleteCamoRequest {
    uuid?: string;
    itemType?: ItemType;
    camoID?: number;
    cascade?: boolean;
}