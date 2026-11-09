package cat.esliceu.drawing.demo.others;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a user tries to modify or delete a drawing that belongs to someone else.
 * Spring answers with HTTP 403.
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class DrawingAccessDeniedException extends RuntimeException {

    public DrawingAccessDeniedException(long id, String username) {
        super("User " + username + " is not the owner of drawing " + id);
    }
}