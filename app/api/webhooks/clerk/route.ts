import { Webhook } from "svix";
import { headers } from "next/headers";
import { clerkClient, WebhookEvent } from "@clerk/nextjs/server";
import { createUser } from "@/actions/user.action";
import { NextResponse } from "next/server";

interface IUser {
  clerkId: string;
  email: string;
  username: string;
  photo: string;
  firstName: string;
  lastName: string;
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
  }

  const headerPayload = headers();
  const svix_id = (await headerPayload).get("svix-id");
  const svix_timestamp = (await headerPayload).get("svix-timestamp");
  const svix_signature = (await headerPayload).get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", { status: 400 });
  }

  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === "user.created") {
    try {
      const { id, email_addresses, image_url, first_name, last_name, username } = evt.data;
  
      if (!email_addresses || email_addresses.length === 0) {
        console.error("No email addresses provided");
        return new Response("No email addresses", { status: 400 });
      }
  
      const user: IUser = {
        clerkId: id,
        email: email_addresses[0].email_address,
        username: username || "default_username", // Provide a fallback
        photo: image_url || "default_photo_url", // Provide a fallback
        firstName: first_name || "",
        lastName: last_name || "",
      };
  
      console.log("Creating user:", user);
  
      const newUser = await createUser(user);
      if (!newUser) {
        console.error("User creation failed");
        return new Response("Failed to create user", { status: 500 });
      }
  
      const client = await clerkClient();
      await client.users.updateUserMetadata(id, {
        publicMetadata: {
          userId: newUser._id,
        },
      });
  
      return NextResponse.json({ message: "New user created", user: newUser });
    } catch (err) {
      console.error("Error processing user.created event:", err);
      return new Response("Internal server error", { status: 500 });
    }
  }
  

  console.log(`Webhook with an ID of ${id} and type of ${eventType}`);
  console.log("Webhook body:", body);

  return new Response("", { status: 200 });
}
