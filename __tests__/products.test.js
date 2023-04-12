// By default Jest does not work with the import syntax
// If you want to use import syntax you should add NODE_OPTIONS=--experimental-vm-modules to the test script in package.json
// On Windows you cannot use NODE_OPTIONS (as well as other env vars in scripts) from the command line --> solution is to use cross-env in order to be able to pass
// env vars to command line scripts on all operative systems!
import supertest from "supertest"
import dotenv from "dotenv"
import mongoose from "mongoose"
import server from "../src/server.js"
import ProductsModel from "../src/api/products/model.js"

dotenv.config() // This command forces .env vars to be loaded into process.env. This is the way to go when you can't use -r dotenv/config

// supertest is capable of running server.listen from our Express app if we pass the server to it
// It will give us back an object (client) that can be used to run http requests on that server
const client = supertest(server)

const validProduct = {
  name: "iPhone",
  description: "Good phone",
  price: 10000,
}

const notValidProduct = {
  description: "Good phone",
  price: 10000,
}

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_TEST_URL)
  const product = new ProductsModel(validProduct)
  await product.save()
}) // beforeAll is a Jest hook which will be ran before all tests, usually this is used to connect to db and to do some initial setup like adding some mock data to the db

afterAll(async () => {
  await ProductsModel.deleteMany()
  await mongoose.connection.close()
}) // afterAll hook could to clean up the situation (close the connection to Mongo gently and clean up db/collections)

describe("Test Products APIs", () => {
  // it("Should test that GET /test endpoint returns 200 and a body containing a message", async () => {
  //   const response = await client.get("/test")
  //   expect(response.status).toBe(200)
  //   expect(response.body.message).toEqual("TEST SUCCESSFULL")
  // })
  it("Should test that env vars are loaded correctly", () => {
    expect(process.env.MONGO_TEST_URL).toBeDefined()
  })

  it("Should test that POST /products returns 201 and an _id if a valid product is provided in req.body", async () => {
    const response = await client.post("/products").send(validProduct).expect(201)
    expect(response.body._id).toBeDefined()
  })

  it("Should test that POST /products returns 400 if a not valid product is provided in req.body", async () => {
    await client.post("/products").send(notValidProduct).expect(400)
  })

  it("Should test that GET /products returns 200 and a body", async () => {
    const response = await client.get("/products").expect(200)
    expect(response.body).toBeDefined()
  })

  it("Should test that GET /products/:id returns 404", async () => {
    await client.get("/products/123456123456123456123456").expect(404)
    
  })


  it("Should test that GET /products/:id returns 200", async () => {
    const products = await ProductsModel.find()
    const response = await client.get(`/products/${products[0]._id}`).expect(200)
    expect(response.body._id).toBeDefined()
    
  })

  it("Should test that DELETE /products/:id returns 204", async () => {
    const products = await ProductsModel.find()
    await client.delete(`/products/${products[0]._id}`).expect(204)
   
  })
  it("Should test that DELETE /products/:id returns 404", async () => {
    await client.delete(`/products/123456123456123456123456`).expect(404)
   
  })

  it("Should test that PUT /products/:id returns 200", async () => {
    const products = await ProductsModel.find()
    await client.put(`/products/${products[0]._id}`).send(validProduct).expect(200)
  })

  it("Should test that PUT /products/:id returns 404", async () => {

    await client.put(`/products/123456123456123456123456`).send(validProduct).expect(404)
  })

  it("Should test that PUT /products/:id returns changed name", async () => {
    const products = await ProductsModel.find()
    await client.put(`/products/${products[0]._id}`).send({name: "laptop"}).expect(200)
    const product = await ProductsModel.findById(products[0]._id)
    expect(product.name).toBe("laptop")
  })


  it("Should test that PUT /products/:id returns name is string", async () => {
    const products = await ProductsModel.find()
    const response = await client.put(`/products/${products[0]._id}`).send({name: "laptop"}).expect(200)
    expect(typeof response.body.name).toBe("string")

  })
})


