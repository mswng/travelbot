import "./PostTable.scss";

import {
    Pencil,
    Trash2,
    Eye,
} from "lucide-react";

export default function PostTable({
    posts,
}) {

    return (
        <div className="post-table-card">

            <table>

                <thead>

                    <tr>
                        <th>Title</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>

                </thead>

                <tbody>

                    {posts.map((post) => (

                        <tr key={post.id}>

                            <td>{post.title}</td>

                            <td>{post.location}</td>

                            <td>
                                <span className="post-status">
                                    {post.status}
                                </span>
                            </td>

                            <td>

                                <div className="post-actions">

                                    <button>
                                        <Eye size={16} />
                                    </button>

                                    <button>
                                        <Pencil size={16} />
                                    </button>

                                    <button className="delete-post">
                                        <Trash2 size={16} />
                                    </button>

                                </div>

                            </td>

                        </tr>
                    ))}

                </tbody>

            </table>

        </div>
    );
}