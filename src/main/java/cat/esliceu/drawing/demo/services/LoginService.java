package cat.esliceu.drawing.demo.services;

import cat.esliceu.drawing.demo.models.User;
import cat.esliceu.drawing.demo.repository.UserRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class LoginService {

    @Autowired
    UserRepo userRepo;

    public boolean checkLogin(String username, int password){
        return true;
    }
}
