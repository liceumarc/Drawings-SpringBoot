package cat.esliceu.drawing.demo.services;

import cat.esliceu.drawing.demo.models.User;
import cat.esliceu.drawing.demo.repository.UserRepo;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
public class LoginService {

    private final UserRepo userRepo;

    public LoginService(UserRepo userRepo) {
        this.userRepo = userRepo;
    }

    public boolean checkLogin(String username, String password) {
        User user = userRepo.findByUserName(username);
        return user != null && Objects.equals(user.getPassword(), password);
    }
}
