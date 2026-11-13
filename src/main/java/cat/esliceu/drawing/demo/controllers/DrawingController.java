package cat.esliceu.drawing.demo.controllers;

import cat.esliceu.drawing.demo.models.Drawing;
import cat.esliceu.drawing.demo.others.DrawingAccessDeniedException;
import cat.esliceu.drawing.demo.others.DrawingForm;
import cat.esliceu.drawing.demo.others.SessionKeys;
import cat.esliceu.drawing.demo.services.DrawingService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/**
 * Every page about drawings: my drawings, gallery and the editor.
 * It only receives the request, calls the service and chooses the view.
 * The rules (who can modify what) live in {@link DrawingService}.
 */
@Controller
@RequestMapping("/drawings")
public class DrawingController {

    private final DrawingService drawingService;

    public DrawingController(DrawingService drawingService) {
        this.drawingService = drawingService;
    }

    @GetMapping
    public String myDrawings(HttpSession session, Model model) {
        model.addAttribute("drawings", drawingService.findMine(currentUser(session)));
        return "drawings";
    }

    @GetMapping("/gallery")
    public String gallery(HttpSession session, Model model) {
        model.addAttribute("entries", drawingService.findGallery(currentUser(session)));
        return "gallery";
    }

    @GetMapping("/new")
    public String newDrawing(Model model) {
        model.addAttribute("mode", "new");
        return "editor";
    }

    /**
     * The owner gets the editor ("edit"); anybody else gets a read-only view ("view").
     */
    @GetMapping("/{id}")
    public String openDrawing(@PathVariable long id, HttpSession session, Model model) {
        Drawing drawing = drawingService.getById(id);
        boolean owner = drawingService.isOwner(drawing, currentUser(session));

        model.addAttribute("drawing", drawing);
        model.addAttribute("authorName", drawingService.getAuthorName(drawing.getOwner()));
        model.addAttribute("mode", owner ? "edit" : "view");
        return "editor";
    }

    @PostMapping
    public String create(@Valid @ModelAttribute DrawingForm form,
                         BindingResult bindingResult,
                         HttpSession session,
                         RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            redirectAttributes.addFlashAttribute("errorMessage", errorText(bindingResult));
            return "redirect:/drawings/new";
        }

        Drawing drawing = drawingService.create(currentUser(session), form);
        redirectAttributes.addFlashAttribute("message", "Dibujo enviado correctamente.");
        redirectAttributes.addFlashAttribute("createdId", drawing.getId());
        return "redirect:/drawings/new";
    }

    @PostMapping("/{id}")
    public String update(@PathVariable long id,
                         @Valid @ModelAttribute DrawingForm form,
                         BindingResult bindingResult,
                         HttpSession session,
                         RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            redirectAttributes.addFlashAttribute("errorMessage", errorText(bindingResult));
            return "redirect:/drawings/" + id;
        }

        drawingService.update(id, currentUser(session), form);
        redirectAttributes.addFlashAttribute("message", "Dibujo actualizado correctamente.");
        return "redirect:/drawings/" + id;
    }

    /**
     * "Send as copy": stores the editor content as a brand new drawing
     * and leaves the user in the original one.
     */
    @PostMapping("/{id}/copy")
    public String copy(@PathVariable long id,
                       @Valid @ModelAttribute DrawingForm form,
                       BindingResult bindingResult,
                       HttpSession session,
                       RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            redirectAttributes.addFlashAttribute("errorMessage", errorText(bindingResult));
            return "redirect:/drawings/" + id;
        }

        drawingService.getById(id); // 404 if the original does not exist
        Drawing copy = drawingService.create(currentUser(session), form);
        redirectAttributes.addFlashAttribute("message", "Copia enviada correctamente.");
        redirectAttributes.addFlashAttribute("createdId", copy.getId());
        return "redirect:/drawings/" + id;
    }

    /**
     * @param from where the delete button was pressed: "gallery" or (by default) "mine"
     */
    @PostMapping("/{id}/delete")
    public String delete(@PathVariable long id,
                         @RequestParam(defaultValue = "mine") String from,
                         HttpSession session,
                         RedirectAttributes redirectAttributes) {

        try {
            drawingService.delete(id, currentUser(session));
        } catch (DrawingAccessDeniedException e) {
            redirectAttributes.addFlashAttribute(
                    "errorMessage",
                    "No puedes borrar un dibujo que no es tuyo."
            );
            return "redirect:/drawings";
        }

        redirectAttributes.addFlashAttribute("message", "Dibujo borrado correctamente.");
        return "gallery".equals(from) ? "redirect:/drawings/gallery" : "redirect:/drawings";
    }

    private String currentUser(HttpSession session) {
        return (String) session.getAttribute(SessionKeys.AUTHENTICATED_USERNAME);
    }

    private String errorText(BindingResult bindingResult) {
        return "No se ha podido enviar el dibujo: " + bindingResult.getAllErrors().get(0).getDefaultMessage();
    }
}