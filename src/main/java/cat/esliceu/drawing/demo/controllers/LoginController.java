package cat.esliceu.drawing.demo.controllers;

import cat.esliceu.drawing.demo.others.LoginForm;
import cat.esliceu.drawing.demo.services.LoginService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class LoginController {

    private static final String AUTHENTICATED_USERNAME = "authenticatedUsername";

    private final LoginService loginService;

    public LoginController(LoginService loginService) {
        this.loginService = loginService;
    }

    @GetMapping("/")
    public String login() {
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String login(@ModelAttribute("loginForm") LoginForm loginForm) {
        return "login";
    }

    @PostMapping("/login")
    public String processar(@Valid @ModelAttribute("loginForm") LoginForm loginForm, BindingResult bindingResult, HttpSession session) {

        if (bindingResult.hasErrors()) {
            return "login";
        }

        if (loginService.checkLogin(loginForm.getUsername(), loginForm.getPassword())) {
            session.setAttribute(AUTHENTICATED_USERNAME, loginForm.getUsername());
            return "redirect:/paint";
        }

        bindingResult.reject("credentials", "Nombre de usuario o contraseña incorrectos");

        return "login";
    }

    @GetMapping("/paint")
    public String paint(HttpSession session) {
        return session.getAttribute(AUTHENTICATED_USERNAME) == null ? "redirect:/login" : "paint";
    }

    @PostMapping("/logout")
    public String logout(HttpSession session, RedirectAttributes redirectAttributes) {
        session.invalidate();
        redirectAttributes.addFlashAttribute("message", "Has cerrado sesión correctamente");
        return "redirect:/login";
    }
}
