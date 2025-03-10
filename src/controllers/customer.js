const { Prisma } = require("@prisma/client");
const prisma = require("../utils/prisma");

const createCustomer = async (req, res) => {
  const { name, phone, email } = req.body;

  if (!name || !phone || !email) {
    return res.status(400).json({
      error: "Missing fields in request body",
    });
  }

  try {
    /**
     * This will create a Customer AND create a new Contact, then automatically relate them with each other
     * @tutorial https://www.prisma.io/docs/concepts/components/prisma-client/relation-queries#create-a-related-record
     */
    const createdCustomer = await prisma.customer.create({
      data: {
        name,
        contact: {
          create: {
            phone,
            email,
          },
        },
      },
      // We add an `include` outside of the `data` object to make sure the new contact is returned in the result
      // This is like doing RETURNING in SQL
      include: {
        contact: true,
      },
    });

    res.status(201).json({ customer: createdCustomer });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2002") {
        return res
          .status(409)
          .json({ error: "A customer with the provided email already exists" });
      }
    }

    res.status(500).json({ error: e.message });
  }
};

const updateCustomer = async (req, res) => {
  const customerId = Number(req.params.id);
  const updatedName = req.body.name;
  const updatedContact = req.body.contact;
  if (!updatedName || updatedName === "") {
    return res.status(400).json({ error: "Missing input field" });
  }

  try {
    if (!updatedContact) {
      const updatedCustomer = await prisma.customer.update({
        where: {
          id: customerId,
        },
        data: {
          name: updatedName,
        },
        include: {
          contact: true,
        },
      });
      res.status(201).json({ customer: updatedCustomer });
    } else {
      const updatedCustomer = await prisma.customer.update({
        where: {
          id: customerId,
        },
        data: {
          name: updatedName,
          contact: {
            update: {
              phone: updatedContact.phone,
              email: updatedContact.email,
            },
          },
        },
        include: {
          contact: true,
        },
      });
      res.status(201).json({ customer: updatedCustomer });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return res
          .status(404)
          .json({ error: `No user with id: ${customerId} found !` });
      }
    }

    res.status(500).json({ error: e.message });
  }
};

module.exports = {
  createCustomer,
  updateCustomer,
};
