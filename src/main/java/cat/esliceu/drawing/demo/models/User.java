package cat.esliceu.drawing.demo.models;

/**
 * Registered user of the application.
 * The username is the login and the unique identifier; the name is the display name.
 */
public class User {

    private final String username;
    private String name;
    private String password;

    public User(String name, String username, String password) {
        this.name = name;
        this.username = username;
        this.password = password;
    }

    public String getUsername() {
        return username;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}