package cat.esliceu.drawing.demo.repository;

import cat.esliceu.drawing.demo.models.User;

public interface UserRepo {
    User findByUserName(String username);

    boolean existsByUserName(String username);

    boolean register(User user);
}
