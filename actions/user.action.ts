"use server";

import User from "@/modals/user.modal";
import { connect } from "@/db";

interface IUser {
    clerkId: string;
    email: string;
    username: string;
    photo: string;
    firstName: string;
    lastName: string;
  }
  

export async function createUser(user: IUser) {
  try {
    await connect();
    const newUser = await User.create(user);
    return JSON.parse(JSON.stringify(newUser));
  } catch (error) {
    console.log(error);
  }
}