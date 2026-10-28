package cat.esliceu.drawing.demo.controllers;

import cat.esliceu.drawing.demo.models.User;
import cat.esliceu.drawing.demo.others.RegisterForm;
import cat.esliceu.drawing.demo.repository.UserRepo;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class RegisterController {

    private final UserRepo userRepo;

    public RegisterController(UserRepo userRepo) {
        this.userRepo = userRepo;
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

        User user = new User(registerForm.getUsername().trim(), registerForm.getPassword());
        if (!userRepo.register(user)) {
            bindingResult.rejectValue("username", "duplicate", "Ese nombre de usuario ya está registrado");
            return "register";
        }

        return "redirect:/login?registered";
    }
}
