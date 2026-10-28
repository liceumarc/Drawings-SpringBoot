# Drawings-SpringBoot

## Registro e inicio de sesión

Ejecuta la aplicación con `.\mvnw.cmd spring-boot:run` y abre `http://localhost:8080`.

- `/register`: crea una cuenta. La contraseña debe tener entre 4 y 10 caracteres, con al menos una mayúscula, una minúscula y un número.
- `/login`: inicia sesión con una cuenta registrada.
- `/paint`: página privada; requiere una sesión iniciada.
- El botón «Cerrar sesión» invalida la sesión.

Hay dos cuentas iniciales: `root` / `Root123` y `marc` / `Marc123`.
Las cuentas nuevas se guardan en memoria y se pierden al reiniciar la aplicación.
Este almacenamiento y las contraseñas sin cifrar son únicamente adecuados para la práctica, no para producción.