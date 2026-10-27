package cat.esliceu.drawing.demo.controllers;

import cat.esliceu.drawing.demo.services.LoginService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class LoginController {

    @Autowired
    LoginService loginService;

    @GetMapping("/login")
    public String login(){
        return "login";
    }

    @PostMapping("/login")
    public String processar(@RequestParam String usuari, @RequestParam int password, HttpSession session, Model model) {

        if (loginService.checkLogin(usuari, password)) {
            session.setAttribute("usuariAutenticat", usuari);
            session.setAttribute("rol", "ADMIN");

            return "redirect:/paint";
        }
        model.addAttribute("error", "Usuari o contrasenya incorrectes");
        return "login";
    }
}
