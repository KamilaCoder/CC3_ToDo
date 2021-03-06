import "./style/style.css";
import "./style/zwicon.css";

const userLists = [];

if (document.cookie) {
  hideLogin();
  fetchLists();
}

document.querySelector(".btn--login").addEventListener("click", () => {
  event.preventDefault();

  const email = document.querySelector(".login-form__input--email").value;
  const password = document.querySelector(".login-form__input--password").value;

  login(email, password);
});

document.querySelector(".btn--new-list").addEventListener("click", () => {
  event.preventDefault();
  document.querySelector(".new-list").classList.add("new-list--active");

  newListEventListener();
});

async function login(email, password) {
  const loginResponse = await postLogin(`/login`, {
    email: email,
    password: password
  });
  console.log(loginResponse);
  if (loginResponse.ok) {
    hideLogin();
    fetchLists();
  }
}

async function fetchLists() {
  const getListsResponse = await getLists()
    .then(res => {
      console.log(res);
      return res.json();
    })
    .then(lists => {
      userLists.length = 0;
      userLists.push(...lists);
    });

  console.log("Lists of current user: ", userLists);
  displayLists(userLists);
  newTaskEventListener();
}

// Display lists

function displayLists(userLists) {
  const listsWrapper = document.querySelector(".lists-wrapper");
  userLists.forEach(list => {
    const tasks = [...list.tasks];
    let tasksHTML = "";
    tasks.forEach(task => {
      let checked = "";
      let checkedClass = "";
      if (task.done) {
        checked = "checked";
        checkedClass = "item__description--checked";
      }
      tasksHTML += `
        <li class="item" data-taskid="${task._id}">
          <input type="checkbox" name="" class="checkbox checkbox--item" ${checked}/>
          <p class="item__description ${checkedClass}">${task.name}</p>
          <button class="btn btn--edit">
            <i class=""></i>
          </button>
          <button class="btn btn--delete">
            <i class="zwicon-trash"></i>
          </button>
        </li>
        `;
    });
    const displayedList = `
    <div class="list" data-listid="${list._id}" data-listname="${list.name}">
      <div class="list__header" style="background-color:${list.color}">
        <button class="btn btn--toggle-list"><i class="zwicon-arrow-circle-down"></i></button>
        <h2 class="list__description">${list.name}</h2>

        <button class="btn btn--delete-list">
          <i class="zwicon-trash"></i>
        </button>
        <button class="btn btn--new-item">
          <i class="zwicon-plus-circle"></i>
        </button>
      </div>
    <ul class="list__items list__items--hidden">
      ${tasksHTML}
    </ul>
    </div>
    `;
    listsWrapper.innerHTML += displayedList;
  });
  deleteListEventListener();
  toggleListEventListener();
  checkTaskEventListener();
  deleteTaskEventListener();
}

// Toggle list on mobile devices

function toggleListEventListener() {
  const listHeaderButtons = document.querySelectorAll(".btn--toggle-list");
  listHeaderButtons.forEach(button => {
    button.addEventListener("click", () => {
      const currentList = button.parentNode.parentNode;
      currentList
        .querySelector(".list__items")
        .classList.toggle("list__items--hidden");
      button.classList.toggle("btn--rotated");
    });
  });
}

// Task create

function newTaskEventListener() {
  const newItemButtons = document.querySelectorAll(".btn--new-item");
  newItemButtons.forEach(button => {
    button.addEventListener("click", event => {
      const targetList = event.currentTarget.parentNode.parentNode;
      addTask(targetList);
    });
  });
}

function addTask(targetList) {
  const initialHtml = `
          <li class="item" data-taskid="new-item">
              <input
                type="checkbox"
                name=""
                id=""
                class="checkbox checkbox--item"
              />
              <p class="item__description item__description--hidden"></p>
              <input type="text" class="item__edit" placeholder="Task description" autofocus/>
              <button class="btn btn--edit">
                <i class="zwicon-checkmark-circle"></i>
              </button>
              <button class="btn btn--delete">
                <i class=""></i>
              </button>
            </li>
  `;
  targetList.querySelector(".list__items").innerHTML += initialHtml;
  const currentItem = targetList.querySelector('[data-taskid="new-item"]');
  const taskInput = currentItem.querySelector(".item__edit");
  const editButton = currentItem.querySelector(".btn--edit");
  const deleteButton = currentItem.querySelector(".btn--delete");
  const itemDescription = currentItem.querySelector(".item__description");

  let taskInputValue = "";

  taskInput.addEventListener("input", () => {
    taskInputValue = taskInput.value;
  });

  editButton.addEventListener("click", async () => {
    if (taskInputValue == "") {
      alert("Task name is empty");
    } else {
      const postTaskResponse = await postTask(
        taskInputValue,
        targetList.dataset.listname
      );
      if (postTaskResponse.ok) {
        taskInput.classList.add("item__edit--hidden");
        itemDescription.classList.remove("item__description--hidden");
        itemDescription.innerText = taskInputValue;
        editButton.children[0].className = "";
        deleteButton.children[0].className = "zwicon-trash";
        await postTaskResponse.json().then(body => {
          currentItem.dataset.taskid = body._id;
        });
      } else {
        alert("Error: probably task with this name already exists...");
      }

      checkTaskEventListener();
      deleteTaskEventListener();
    }
  });
}
// Delete task

function deleteTaskEventListener() {
  const deleteTaskButtons = document.querySelectorAll(".btn--delete");
  deleteTaskButtons.forEach(button => {
    const currentTask = button.parentNode;
    const currentTaskId = button.parentNode.dataset.taskid;

    button.addEventListener("click", async () => {
      console.log(currentTask);
      currentTask.parentNode.removeChild(currentTask);
      const deleteTaskResponse = await deleteTask(currentTaskId);
    });
  });
}

// check task
function checkTaskEventListener() {
  const checkboxes = document.querySelectorAll(".checkbox--item");
  checkboxes.forEach(checkbox => {
    const currentTask = checkbox.parentNode;
    const currentTaskId = currentTask.dataset.taskid;
    const currentTaskDesc = currentTask.querySelector(".item__description")
      .innerText;
    const currentList = currentTask.parentNode.parentNode.dataset.listname;
    checkbox.addEventListener("change", async () => {
      if (checkbox.checked) {
        currentTask
          .querySelector(".item__description")
          .classList.add("item__description--checked");
        checkbox.setAttribute("checked", "true");
        console.log(currentTaskId, currentTaskDesc, currentList);

        const checkTaskResponse = await putTask(
          currentTaskId,
          currentTaskDesc,
          currentList,
          true
        );
      } else {
        currentTask
          .querySelector(".item__description")
          .classList.remove("item__description--checked");
        checkbox.setAttribute("checked", "false");
        console.log(currentTaskId, currentTaskDesc, currentList);
        const checkTaskResponse = await putTask(
          currentTaskId,
          currentTaskDesc,
          currentList,
          false
        );
      }
    });
  });
}

// Adding list

function newListEventListener() {
  document
    .querySelector(".new-list__form")
    .addEventListener("submit", async () => {
      event.preventDefault();

      document.querySelector(".new-list").classList.remove("new-list--active");
      document.querySelector(".new-list").classList.add("new-list");

      const listName = document.querySelector(".new-list-input").value;
      let listColor;

      const radios = document.getElementsByName("color");
      for (var i = 0, length = radios.length; i < length; i++) {
        if (radios[i].checked) {
          listColor = radios[i].value;
          break;
        }
      }
      const postListResponse = await postList(listName, listColor);

      if (postListResponse.ok) {
        document.querySelector(".lists-wrapper").innerHTML = "";
        await fetchLists();
      } else {
        alert("List name empty or it already exists.");
      }
    });
}

// Delete list

function deleteListEventListener() {
  document.querySelectorAll(".btn--delete-list").forEach(input =>
    input.addEventListener("click", e => {
      e.preventDefault();
      const listId = e.target.parentNode.parentNode.parentNode.getAttribute(
        "data-listid"
      );
      if (confirm("Are you sure you want to delete this list?")) {
        const index = userLists.findIndex(obj => obj._id === listId);
        userLists.splice(index, 1);
        deleteList(listId);
        document.querySelector(".lists-wrapper").innerHTML = "";
        displayLists(userLists);
      }
    })
  );
}

// hide/show login screen
function hideLogin() {
  document.querySelector(".login-screen").classList.add("login-screen--hidden");
  document
    .querySelector(".main-screen")
    .classList.remove("main-screen--hidden");
}

function showLogin() {
  document
    .querySelector(".login-screen")
    .classList.remove("login-screen--hidden");
  document.querySelector(".main-screen").classList.add("main-screen--hidden");
}

function postLogin(url, data) {
  console.log(url, data);

  return fetch(url, {
    method: "POST",
    mode: "cors",
    credentials: "include", // Don't forget to specify this if you need cookies
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
}

function getLists() {
  return fetch("/user/lists", {
    method: "GET",
    mode: "cors",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function postList(name, color) {
  return fetch(`/user/lists`, {
    method: "POST",
    mode: "cors",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: name,
      color: color
    })
  });
  //przykład: const postListResponse = postList('newlist','newColor');
}

function putList(listId, name, color) {
  return fetch(`/user/lists/${listId}`, {
    method: "PUT",
    mode: "cors",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: name,
      color: color
    })
  });
  //przykład: const putListResponse = await putList('5cc595c9b273b022d1d6bc8b', 'newer list', 'never color');
}

function deleteList(listId) {
  return fetch(`/user/lists/${listId}`, {
    method: "DELETE",
    mode: "cors",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    }
  });
  //przykład: const deleteListResponse = await deleteList('5cc575a8d39f43b7d1ec3091');
}

function postTask(name, list) {
  return fetch(`/user/tasks`, {
    method: "POST",
    mode: "cors",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: name,
      list: list
    })
  });
  //przykład: const postTaskResponse = await postTask('newTask', 'someList', '2019-04-30');
}

function putTask(taskId, name, list, done) {
  return fetch(`/user/tasks/${taskId}`, {
    method: "PUT",
    mode: "cors",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: name,
      list: list,
      done: done
    })
  });
  //przykład: const putTaskResponse = await putTask('5cc5bd3013e35113c455be5e', 'newer Task 500', 'someList', '2019-05-06', done);
}

function deleteTask(taskId) {
  return fetch(`/user/tasks/${taskId}`, {
    method: "DELETE",
    mode: "cors",
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    }
  });
  //przykład: const deleteTaskResponse = await deleteTask('5cc5bd3013e35113c455be5e');
}

// logging out
document.querySelector(".btn--logout").addEventListener("click", () => {
  document.cookie = "token= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";
  document.querySelector(".lists-wrapper").innerHTML = "";
  userLists.splice(0, userLists.length);
  showLogin();
});
