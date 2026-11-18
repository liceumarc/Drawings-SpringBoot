package cat.esliceu.drawing.demo.others;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class DrawingAccessDeniedException extends RuntimeException {

    public DrawingAccessDeniedException(long id, String username) {
        super("User " + username + " is not the owner of drawing " + id);
    }
}