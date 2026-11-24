import { Weapon } from "~~/prisma/generated/client";
import { ApiResponse } from "..";

export interface PostWeaponRequest {
    weaponType: number;
    weaponName: string;
}

export interface GetWeaponResponse extends ApiResponse<Weapon[]> {};