package cat.esliceu.drawing.demo.others;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;

/**
 * Runs before every protected request and lets it through only if
 * a user is authenticated in the HttpSession.
 */
public class AuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {

        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute(SessionKeys.AUTHENTICATED_USERNAME) == null) {

            response.sendRedirect(request.getContextPath() + "/login");
            return false;

        }

        return true;
    }
}