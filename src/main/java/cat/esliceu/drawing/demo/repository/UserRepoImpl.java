package cat.esliceu.drawing.demo.repository;

import cat.esliceu.drawing.demo.models.User;
import org.springframework.stereotype.Repository;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Repository
public class UserRepoImpl implements UserRepo {

    private final ConcurrentMap<String, User> users = new ConcurrentHashMap<>();

    public UserRepoImpl() {
        users.put("root", new User("root", "Root123"));
        users.put("marc", new User("marc", "Marc123"));
    }

    @Override
    public User findByUserName(String username) {
        return users.get(username);
    }

    @Override
    public boolean existsByUserName(String username) {
        return users.containsKey(username);
    }

    @Override
    public boolean register(User user) {
        return users.putIfAbsent(user.getUsername(), user) == null;
    }
}
