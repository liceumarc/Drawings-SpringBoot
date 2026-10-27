package cat.esliceu.drawing.demo.repository;

import cat.esliceu.drawing.demo.models.User;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepoImpl implements UserRepo{


    @Override
    public User findByUserName(String username) {
        if (username.equals("root")){
            return new User("root", "1234");
        } else if (username.equals("marc")) {
            return new User("marc", "1234");
        }
        return null;
    }
}
