import { prisma } from "../dbconfig/db.js";
import { hashEmail, signHash } from "../crypto/signer.js";
import protobuf from "protobufjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create user
export const createUser = async (req, res) => {
  try {
    const { email, role = "user", status = "active" } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const hash = hashEmail(email);
    const signature = signHash(hash);

    const user = await prisma.user.create({
      data: { email, role, status, hash, signature },
    });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  const users = await prisma.user.findMany({ orderBy: { id: "desc" } });
  res.json(users);
};

// Update user
export const updateUser = async (req, res) => {
  const id = parseInt(req.params.id);
  const { email, role, status } = req.body;

  const data = {};
  if (email) {
    const hash = hashEmail(email);
    const signature = signHash(hash);
    data.email = email;
    data.hash = hash;
    data.signature = signature;
  }
  if (role) data.role = role;
  if (status) data.status = status;

  const updated = await prisma.user.update({ where: { id }, data });
  res.json(updated);
};

// Delete user
export const deleteUser = async (req, res) => {
  const id = parseInt(req.params.id);
  await prisma.user.delete({ where: { id } });
  res.json({ message: "User deleted" });
};

// Export users as protobuf
export const exportUsersProto = async (req, res) => {
  const users = await prisma.user.findMany();
  const root = await protobuf.load(path.join(__dirname, "../proto/user.proto"));
  const UserList = root.lookupType("userpackage.UserList");

  const payload = {
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
      hash: u.hash,
      signature: u.signature,
    })),
  };

  const errMsg = UserList.verify(payload);
  if (errMsg) throw new Error(errMsg);

  const message = UserList.create(payload);
  const buffer = UserList.encode(message).finish();

  res.setHeader("Content-Type", "application/octet-stream");
  res.send(Buffer.from(buffer));
};
