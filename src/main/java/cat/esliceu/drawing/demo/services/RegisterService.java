package cat.esliceu.drawing.demo.services;

import cat.esliceu.drawing.demo.models.User;
import cat.esliceu.drawing.demo.repository.UserRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class RegisterService {

    private static final Logger log = LoggerFactory.getLogger(RegisterService.class);

    private final UserRepo userRepo;

    public RegisterService(UserRepo userRepo) {
        this.userRepo = userRepo;
    }

    public boolean register(String name, String username, String password) {
        User user = new User(name.trim(), username.trim(), password);
        boolean registered = userRepo.register(user);
        if (registered) {
            log.info("New user registered: {}", user.getUsername());
        } else {
            log.warn("Registration rejected, username already exists: {}", user.getUsername());
        }
        return registered;
    }
}