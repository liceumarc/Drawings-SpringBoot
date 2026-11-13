package cat.esliceu.drawing.demo.repository;

import cat.esliceu.drawing.demo.models.DrawingElement;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class DrawingRepoImplTest {

    @Test
    void mapsDrawingJsonIncludingFreehandPoints() {
        DrawingRepo repository = new DrawingRepoImpl(new ObjectMapper());
        String json = """
                [
                  {"id":1,"type":"circle","name":"Círculo 1","x":213,"y":156,"size":50,
                   "rotation":0,"fill":"#818cf8","stroke":"#312e81"},
                  {"id":2,"type":"freehand","name":"Trazo 1","x":600,"y":264,"size":84,
                   "rotation":0,"fill":"#818cf8","stroke":"#312e81",
                   "points":[{"x":0.383,"y":-0.926},{"x":0.37,"y":-0.912}]}
                ]
                """;

        List<DrawingElement> elements = repository.mapJsonToElements(json);

        assertEquals(2, elements.size());
        assertEquals("circle", elements.get(0).getType());
        assertEquals(213, elements.get(0).getX());
        assertEquals("#818cf8", elements.get(0).getFill());
        assertEquals("freehand", elements.get(1).getType());
        assertEquals(2, elements.get(1).getPoints().size());
        assertEquals(0.383, elements.get(1).getPoints().get(0).getX(), 0.0001);
        assertEquals(-0.926, elements.get(1).getPoints().get(0).getY(), 0.0001);
    }
}
