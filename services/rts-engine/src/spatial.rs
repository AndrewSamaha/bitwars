use std::collections::HashMap;

pub const CELL_SIZE: f32 = 1_000.0;

pub struct SpatialIndex {
    cells: HashMap<(i32, i32), Vec<usize>>,
}

impl SpatialIndex {
    pub fn new() -> Self {
        Self {
            cells: HashMap::new(),
        }
    }

    fn cell(coordinate: f32) -> i32 {
        (coordinate / CELL_SIZE).floor() as i32
    }

    pub fn insert(&mut self, index: usize, x: f32, y: f32) {
        self.cells
            .entry((Self::cell(x), Self::cell(y)))
            .or_default()
            .push(index);
    }

    pub fn insert_area(&mut self, index: usize, x: f32, y: f32, radius: f32) {
        for cell_x in Self::cell(x - radius)..=Self::cell(x + radius) {
            for cell_y in Self::cell(y - radius)..=Self::cell(y + radius) {
                self.cells.entry((cell_x, cell_y)).or_default().push(index);
            }
        }
    }

    pub fn at(&self, x: f32, y: f32) -> impl Iterator<Item = usize> + '_ {
        self.cells
            .get(&(Self::cell(x), Self::cell(y)))
            .into_iter()
            .flatten()
            .copied()
    }

    pub fn within(&self, x: f32, y: f32, radius: f32) -> Vec<usize> {
        let mut result = Vec::new();
        for cell_x in Self::cell(x - radius)..=Self::cell(x + radius) {
            for cell_y in Self::cell(y - radius)..=Self::cell(y + radius) {
                if let Some(indexes) = self.cells.get(&(cell_x, cell_y)) {
                    result.extend(indexes);
                }
            }
        }
        result.sort_unstable();
        result
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_points_and_areas_across_cell_boundaries() {
        let mut index = SpatialIndex::new();
        index.insert(2, 1_050.0, 0.0);
        index.insert(1, 950.0, 0.0);
        assert_eq!(index.within(1_000.0, 100.0, 150.0), vec![1, 2]);

        index.insert_area(3, -950.0, 0.0, 100.0);
        assert_eq!(index.at(-1_050.0, 0.0).collect::<Vec<_>>(), vec![3]);
    }
}
