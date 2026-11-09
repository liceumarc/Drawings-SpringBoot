# Drawings-SpringBoot

## Registro e inicio de sesión

Ejecuta la aplicación con `.\mvnw.cmd spring-boot:run` y abre `http://localhost:8080`.

- `/register`: crea una cuenta. La contraseña debe tener entre 5 y 10 caracteres, con al menos una mayúscula, una minúscula y un número.
- `/login`: inicia sesión con una cuenta registrada.
- `/drawings`: historial propio; `/drawings/gallery` muestra los dibujos de todos los usuarios.
- `/drawings/new`: editor para crear dibujos; requiere una sesión iniciada.
- El botón «Cerrar sesión» invalida la sesión.

Hay dos cuentas iniciales: `root` / `Root123` y `marc` / `Marc123`.
Las cuentas nuevas se guardan en memoria y se pierden al reiniciar la aplicación.
Este almacenamiento y las contraseñas sin cifrar son únicamente adecuados para la práctica, no para producción.

## Editor

El editor permite crear círculos, cuadrados, triángulos, estrellas de siete puntas y trazos a mano alzada. Los borradores, las dimensiones y el historial de deshacer/rehacer se conservan en `localStorage`, separados por usuario y dibujo. Los cambios se envían al servidor únicamente al pulsar «Enviar dibujo» o «Guardar cambios»; el envío usa el formulario normal y vuelve a cargar la página.

Ctrl+Z deshace y Ctrl+Y o Ctrl+Mayús+Z rehace.