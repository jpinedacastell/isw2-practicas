const DEMO_USER = { username: "admin", password: "admin123" };

// Devuelve los mensajes de error de los campos vacíos.
function validate({ username, password }) {
  const errors = {};

  if (username === "") {
    errors.username = "Ingresa tu usuario";
  }
  if (password === "") {
    errors.password = "Ingresa tu contraseña";
  }

  return errors;
}

// Comprueba si las credenciales son correctas.
function authenticate({ username, password }) {
  return username === DEMO_USER.username && password === DEMO_USER.password;
}

// Muestra los errores de cada campo y enfoca el primero inválido.
function showFieldErrors(form, errors) {
  const inputs = Array.from(form.querySelectorAll("input"));

  for (const input of inputs) {
    const error = errors[input.name] || "";
    document.getElementById(`${input.id}-error`).textContent = error;
    input.setAttribute("aria-invalid", error ? "true" : "false");
  }

  const firstInvalid = inputs.find((input) => errors[input.name]);
  if (firstInvalid) {
    firstInvalid.focus();
  }
}

// Muestra el mensaje general del login.
function showMessage(text, type) {
  const message = document.getElementById("login-message");
  message.textContent = text;
  message.className = type ? `login-message ${type}` : "login-message";
}

// Valida el formulario e intenta iniciar sesión.
function handleSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const credentials = {
    username: form.elements.username.value.trim(),
    password: form.elements.password.value,
  };
  const errors = validate(credentials);

  showFieldErrors(form, errors);
  showMessage("");

  if (Object.keys(errors).length > 0) {
    return;
  }

  if (authenticate(credentials)) {
    showMessage(`Bienvenido, ${credentials.username}`, "is-success");
  } else {
    showMessage("Usuario o contraseña incorrectos", "is-error");
  }
}

document.getElementById("login-form").addEventListener("submit", handleSubmit);
