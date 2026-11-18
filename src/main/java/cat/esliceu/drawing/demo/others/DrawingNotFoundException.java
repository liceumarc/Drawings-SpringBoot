package cat.esliceu.drawing.demo.others;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class DrawingNotFoundException extends RuntimeException {

    public DrawingNotFoundException(long id) {
        super("Drawing not found: " + id);
    }
}