package cat.esliceu.drawing.demo.others;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a drawing id does not exist. Spring answers with HTTP 404.
 */
@ResponseStatus(HttpStatus.NOT_FOUND)
public class DrawingNotFoundException extends RuntimeException {

    public DrawingNotFoundException(long id) {
        super("Drawing not found: " + id);
    }
}