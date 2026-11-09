package cat.esliceu.drawing.demo.others;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

/**
 * Runs before every protected request and lets it through only if
 * a user is authenticated in the HttpSession.
 */
public class AuthInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(AuthInterceptor.class);

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {
        // false = do not create a new session just to check it
        HttpSession session = request.getSession(false);

        boolean authenticated = session != null
                && session.getAttribute(SessionKeys.AUTHENTICATED_USERNAME) != null;

        if (!authenticated) {
            log.debug("Anonymous access to {} redirected to login", request.getRequestURI());
            response.sendRedirect(request.getContextPath() + "/login");
            return false; // the request never reaches the controller
        }

        return true;
    }
}