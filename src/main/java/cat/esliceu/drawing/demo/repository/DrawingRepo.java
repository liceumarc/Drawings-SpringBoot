package cat.esliceu.drawing.demo.repository;

import cat.esliceu.drawing.demo.models.Drawing;
import cat.esliceu.drawing.demo.models.DrawingElement;

import java.util.List;

public interface DrawingRepo {

    Drawing save(Drawing drawing);

    Drawing findById(long id);

    List<Drawing> findByOwner(String owner);

    List<Drawing> findAll();

    boolean deleteById(long id);

    List<DrawingElement> mapJsonToElements(String json);
}