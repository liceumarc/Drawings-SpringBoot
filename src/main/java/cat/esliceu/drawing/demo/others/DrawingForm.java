package cat.esliceu.drawing.demo.others;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Data sent by the editor form when the user presses "Send".
 * The browser fills the hidden fields from its localStorage state.
 */
public class DrawingForm {

    // No @NotBlank: an empty name is allowed, the service assigns a random one
    @Size(max = 50, message = "El nombre no puede superar los 50 caracteres")
    private String name;

    @NotNull(message = "El ancho es obligatorio")
    @Min(value = 100, message = "El ancho mínimo es 100")
    @Max(value = 2000, message = "El ancho máximo es 2000")
    private Integer width;

    @NotNull(message = "El alto es obligatorio")
    @Min(value = 100, message = "El alto mínimo es 100")
    @Max(value = 2000, message = "El alto máximo es 2000")
    private Integer height;

    @NotNull(message = "El número de objetos es obligatorio")
    @Min(value = 0, message = "El número de objetos no puede ser negativo")
    private Integer objectCount;

    @NotBlank(message = "El dibujo no tiene contenido")
    private String drawingJson;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public Integer getObjectCount() {
        return objectCount;
    }

    public void setObjectCount(Integer objectCount) {
        this.objectCount = objectCount;
    }

    public String getDrawingJson() {
        return drawingJson;
    }

    public void setDrawingJson(String drawingJson) {
        this.drawingJson = drawingJson;
    }
}