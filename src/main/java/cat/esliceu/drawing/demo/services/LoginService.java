package cat.esliceu.drawing.demo.services;

import cat.esliceu.drawing.demo.models.User;
import cat.esliceu.drawing.demo.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;

public class LoginService {

    @Autowired
    UserRepo userRepo;

    public boolean checkLogin(String username, int password){
        User u = userRepo.findByUserName(username);
        if (u == null) return false;
        return (password == u.getPassword());
    }
}
