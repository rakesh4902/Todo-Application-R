const express = require("express");
const path = require("path");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

let dirPath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

//initialize db and server
let db = null;

const initializeDbAbdServer = async () => {
  try {
    db = await open({
      filename: dirPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB ERROR ${e.message}`);
    process.exit(1);
  }
};

initializeDbAbdServer();

//checking if query contains both priority and status
const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

//checking if query contains only priority
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

//checking if query contains only status
const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//API-1=>SCENARIO-1-2-3-4
app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status } = request.query;
  let getTodoQuery = "";
  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodoQuery = `
            SELECT *
            FROM todo
            WHERE 
            todo Like '%${search_q}%'
            AND status='${status}'
            AND priority='${priority}';`;
      break;
    case hasPriority(request.query):
      getTodoQuery = `
            SELECT * 
            FROM todo
            WHERE 
            todo Like '%${search_q}%'
            AND priority='${priority}';`;
      break;
    case hasStatus(request.query):
      getTodoQuery = `
            SELECT * 
            FROM todo
            WHERE 
            todo Like '%${search_q}%'
            AND status='${status}';`;
      break;

    default:
      getTodoQuery = `
            SELECT * FROM todo
            WHERE todo Like '%${search_q}%';`;
      break;
  }
  let td = await db.all(getTodoQuery);
  console.log(td);
  response.send(td);
});

//API-2
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getTodoIdQuery = `
    SELECT *
    FROM todo
    WHERE id=${todoId};`;
  let data = await db.get(getTodoIdQuery);
  console.log(data);
  response.send(data);
});

//API-3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const getTodoQuery = `
    INSERT INTO todo(id,todo,priority,status)
    VALUES(${id},'${todo}','${priority}','${status}');`;
  const data = await db.run(getTodoQuery);
  console.log(data);
  /*
  const { id, todo, priority, status } = request.body;
  console.log(id);
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}');`;
  await db.run(postTodoQuery);*/
  response.send("Todo Successfully Added");
});

//API-4 - SCENARIO-1-2-3
app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateColumn = "";
  switch (true) {
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }

  const prevToDoQuery = `
    SELECT * 
    FROM todo
    WHERE id=${todoId};`;
  const prevToDO = await db.get(prevToDoQuery);

  const {
    todo = prevToDO.todo,
    priority = prevToDO.priority,
    status = prevToDO.status,
  } = request.body;

  const updateQuery = `
    UPDATE todo
    SET todo='${todo}',
    priority='${priority}',
    status='${status}'
    WHERE id=${todoId};`;

  await db.run(updateQuery);
  response.send(`${updateColumn} Updated`);
});

//API-5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    DELETE from todo
    WHERE id=${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
