package cat.esliceu.drawing.demo.controllers;

import cat.esliceu.drawing.demo.others.LoginForm;
import cat.esliceu.drawing.demo.others.SessionKeys;
import cat.esliceu.drawing.demo.services.LoginService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class LoginController {

    private final LoginService loginService;

    public LoginController(LoginService loginService) {
        this.loginService = loginService;
    }

    @GetMapping("/")
    public String root() {
        // The interceptor sends anonymous users on to /login
        return "redirect:/drawings";
    }

    @GetMapping("/login")
    public String loginForm(@ModelAttribute("loginForm") LoginForm loginForm, HttpSession session) {
        if (session.getAttribute(SessionKeys.AUTHENTICATED_USERNAME) != null) {
            return "redirect:/drawings";
        }
        return "login";
    }

    @PostMapping("/login")
    public String processLogin(@Valid @ModelAttribute("loginForm") LoginForm loginForm,
                               BindingResult bindingResult,
                               HttpSession session) {
        if (bindingResult.hasErrors()) {
            return "login";
        }

        // Registration trims the username, so login must trim it too
        String username = loginForm.getUsername().trim();

        if (loginService.checkLogin(username, loginForm.getPassword())) {
            session.setAttribute(SessionKeys.AUTHENTICATED_USERNAME, username);
            return "redirect:/drawings";
        }

        bindingResult.reject("credentials", "Nombre de usuario o contraseña incorrectos");
        return "login";
    }

    @PostMapping("/logout")
    public String logout(HttpSession session, RedirectAttributes redirectAttributes) {
        session.invalidate();
        redirectAttributes.addFlashAttribute("message", "Has cerrado sesión correctamente");
        return "redirect:/login";
    }
}