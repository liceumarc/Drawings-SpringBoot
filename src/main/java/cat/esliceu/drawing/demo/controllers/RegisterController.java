package cat.esliceu.drawing.demo.controllers;

import cat.esliceu.drawing.demo.others.RegisterForm;
import cat.esliceu.drawing.demo.services.RegisterService;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class RegisterController {

    private final RegisterService registerService;

    public RegisterController(RegisterService registerService) {
        this.registerService = registerService;
    }

    @GetMapping("/register")
    public String register(@ModelAttribute("registerForm") RegisterForm registerForm) {
        return "register";
    }

    @PostMapping("/register")
    public String registerNewUser(@Valid @ModelAttribute("registerForm") RegisterForm registerForm, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return "register";
        }

        boolean registered = registerService.register(
                registerForm.getName(),
                registerForm.getUsername(),
                registerForm.getPassword());

        if (!registered) {
            bindingResult.rejectValue("username", "duplicate", "Ese nombre de usuario ya está registrado");
            return "register";
        }

        return "redirect:/login?registered";
    }
}